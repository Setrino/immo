var request = require('request');
var cheerio = require('cheerio');
var jsonfile = require('jsonfile');
var async = require('async');
var file = '';
var buildings = [];
var iCalEvent = require('icalevent');
var fs = require('fs');

days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

courses = {
    //'bac1a': 10394
    'bac2a': 11198
    //'bac1' : 1  //exams
    //'bac1p' : 10190
};

dates = {
    'Monday'    : '2014-09-15',
    'Tuesday'   : '2014-09-16',
    'Wednesday' : '2014-09-17',
    'Thursday'  : '2014-09-18',
    'Friday'    : '2014-09-19'

}

var courseIds = Object.keys(courses);

function perCourse(courseId, callback) {
    var course = courses[courseId];
    file = 'buildings';
    //var url = 'http://hec.unil.ch/hec/timetables/snc_de_pub?pub_id=' + course;    // exams
    var uri = 'http://www.immostreet.ch';
    var url = 'http://www.immostreet.ch/en/SearchEngine/Rent/Switzerland/All?AreaId=8c79c6b5-b61a-45f9-8560-91ae4825ac6a&' +
        'AreaIdAgregate=8c79c6b5-b61a-45f9-8560-91ae4825ac6a&SearchCriteriaImmoId=766388da-719c-7644-cb71-8dcaf843cdeb&p' +
        '=15';
    //384 - scale 10.1

    request(url, (function(course) { return function(err, resp, body) {
        $ = cheerio.load(body);

        //console.log($("#search-engine_list").children('div'));

        //Inner Page

        //Main Page
        $($("#search-engine_list > div")).each(function(day){

            if($(this).attr('id') != 'undefined'){
                var link = uri + $(this).find('.classified_thumb').children('a').attr('href');
                //console.log($(this).find('.classified_thumb').children('a').attr('href'));
                //$(this).find('.classified_thumb').children('a').attr('href') // LINK

                //console.log(link);
                request(link, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        //console.log(body);
                        $ = cheerio.load(body);
                        innerBuilding($(".id_content .inner"), $);
                    }
                });
            }
        }), callback();
    }})(courseId));
}

async.each(courseIds, perCourse, function (err) {
    // Executed after for loop finished;
    setTimeout(writeToJSON, 20000);
    //writeToJSON();
});


//Building Object
//dublicate - array for dublicate elements. [location, group]
function Building(){

    this.features = {title: String,
                     array: {}
                    };
    this.contact = {title: String,
                    agency: {
                        link: String,
                        logo: String,
                        name: String,
                        address: String,
                        city: String,
                        phone: String,
                        fax: String
                            }
    };
}

//current - current event object, lecture
//string - temporary string for the searched path
//array - event array
//callback - function

function checkRoom(string){
    var temp = string.toLowerCase();
    return temp.match(/amphi|inter|anthr|géop/i) && !temp.match(/!!!/) && !temp.match(/!!/);
}

function checkLecturer(string){

    return string.match(/[a-z]+\./i) || string.match(/poste/i);
}

Building.prototype = {

    setTime_Start : function(time){

        this.time_start = time;
    },

    setTime_End : function(time){

        this.time_end = time;
    },

    setLecture_Name : function(lecture){

        if(this.lecture_name == null){
            this.lecture_name = lecture;
        }
    },

    setLocation : function(location){

        if(this.location != null){
            this.dublicate = [location];
        }else{
            this.location = location;
        }
    },

    setGroup : function(group){

        if(this.group != null){
            this.dublicate.push(group);
        }else{
            this.group = group;
        }
    },

    setPeriod: function(period){

        this.period = period;
    },

    setLecturer: function(lecturer){

        this.lecturer = lecturer;
    },

    setDetails: function(details){

        this.details = details;
    }
}

function innerBuilding(body, $){

    var building = new Building();
    var not_allowed = ['id_nav __no-print', 'id_print __print-only', 'id_share id_properties __no-print', '__print-only'];

    $(body.children('div')).each(function(){

        var that = $(this);

        if(not_allowed.indexOf($(this).attr('class')) == -1){

            switch(that.attr('class')){
                case 'row row__drop __no-gutters __no-print' :
                    //console.log($(this).attr());
                    break;
                case 'id_description' :
                    //console.log($(this).attr());
                    break;
            };

            switch(that.attr('id')){
                case 'id_features' :
                    building.features.title =  $(this).find('.id_properties_title').html();
                    var temp = [];
                    $(that.find('.id_label-value_item')).each(function(){

                        building.features.array[$(this).children('.id_label-value_item_label').html()] =
                            $(this).children('.id_label-value_item_value').html();
                    });
                    break;
                case 'id_contact_stripe' :
                    building.contact.title = trim($(this).find('.id_properties_title').html());
                    building.contact.agency.link = $(this).find('.id_agency_logo_link').attr('href');
                    building.contact.agency.logo = $(this).find('.id_agency_logo_link_img').attr('src');
                    building.contact.agency.reference = substring(trim($(this).find('.row p:nth-child(2)').html()), 11);
                    building.contact.agency.name = trim($(this).find('.row div:nth-child(2) p span:first-child').html());
                    building.contact.agency.address = trim($(this).find('.row div:nth-child(2) p span.address1').html());
                    building.contact.agency.city = trim($(this).find('.row div:nth-child(2) p span:nth-child(5)').html());
                    building.contact.agency.phone = trim($(this).find('#business-unit-phone-print').html());
                    building.contact.agency.fax = trim($(this).find('#business-unit-fax-print').html());
                    break;
            }
        }
    });

    console.log(building);
    buildings.push(building);
}

function substring(string, from, to){
    return string.substring(from, to || string.length);
}

function trim(string){
    return (string != null) ? string.trim() : null;
}

function recursiveEvents(current, string, array, course, day, callback){

    var lectureT = current;

    if(array.length == 0 && string == ''){

        callback();
    }else{

        if(current == null){

            lectureT = new Building(day, course, 0, null);
            //timetable.push(lectureT);
        }

        string = (string == '') ? string + array.shift() : string + ' ' + array.shift();

        if(string.match(/[a-z]+\.+[a-z]+\//i)){

        }

        if(checkRoom(string)){
            lectureT.setLocation(string);
            recursiveEvents(lectureT, '', array, course, day, callback);
        }else if(string.match(/Semaine/)){
            if(string.match(/8-14:/)){
                string += ' ' + array.shift() + array.shift();
                lectureT.setDetails(string);
                recursiveEvents(lectureT, '', array, course, day, callback);
            }else{
                recursiveEvents(lectureT, string, array, course, day, callback);
            }
            //Set time
        }else if(/\d/g.test(string) && /:/.test(string)){

            if(string.match(/!!!/)){
                if(array[0].match(/[a-z]+\./i)){
                    lectureT.setDetails(string);
                    recursiveEvents(lectureT, '', array, course, day, callback);
                }else{
                    recursiveEvents(lectureT, string, array, course, day, callback);
                }
            }else{
                if(array[0] == '-'){
                    lectureT.setTime_Start(string);
                }else{
                    lectureT.setTime_End(string);
                }
                recursiveEvents(lectureT, '', array, course, day, callback);
            }
        }else if(string.match(/Automne|Printemps/i)){

            lectureT.setPeriod(string);
            recursiveEvents(lectureT, '', array, course, day, callback);
        }else if(string.match(/groupe/i) && !string.match(/de/i)){

            if(string.length == 6){
                string += ' ' + array.shift();
                lectureT.setGroup(string);
            }else{
                var tempS = string.split(' ').pop();
                var string = string.substring(0, string.length - 7);
                tempS += ' ' + array.shift();
                lectureT.setGroup(tempS);
                lectureT.setDetails(string);
            }
            recursiveEvents(lectureT, '', array, course, day, callback);
            //Lecturer's name
        }else if(checkLecturer(string)){

            if(string.match(/poste/)){
                if(string.match(/externe/)){
                    lectureT.setLecturer(string);
                    buildings.push(lectureT);
                    recursiveEvents(null, '', array, course, day, callback);
                }else{
                    recursiveEvents(lectureT, string, array, course, day, callback);
                }
            }else if(string.match(/\.+\s+[a-z]/i) && array.length > 1 && checkLecturer(array[0])){
                lectureT.setDetails(string);
                recursiveEvents(lectureT, '', array, course, day, callback);
            }else if(string.match(/-/)){
                recursiveEvents(lectureT, string, array, course, day, callback);
            }else{
                if(string.match(/\.+/) && string.length < 6){
                    recursiveEvents(lectureT, string, array, course, day, callback);
                }else{
                    lectureT.setLecturer(string);
                    if(lectureT.dublicate != null){
                        var tempObject = {};
                        for (var prop in lectureT) {
                            tempObject[prop] = lectureT[prop];
                        }
                        tempObject.location = lectureT.dublicate[0];
                        tempObject.group = lectureT.dublicate[1];
                        delete tempObject.dublicate;
                        buildings.push(tempObject);
                    }
                    delete lectureT.dublicate;
                    buildings.push(lectureT);
                    recursiveEvents(null, '', array, course, day, callback);
                }
            }
        }else if(string.match(/Analyse/) && array[0].match(/macro/)){

                recursiveEvents(lectureT, string, array, course, day, callback);
        // Check Details
        }else if(string.match(/^[a-z0-9àÀ-ÿ\-\ '!@#\$%\^\&*\)\(+=., ]+$/i)){

            if(string.toLowerCase().match(/semaine/)){
                //console.log(string);
            }

            if(string.match(/-/) && string.length == 1){

                recursiveEvents(lectureT, '', array, course, day, callback);
            }else if(string.match(/(!!)/) || string.match(/(!!!)/)){
                recursiveEvents(lectureT, string, array, course, day, callback);
            }else if(array.length > 1 && checkRoom(array[0])){
                //console.log(string + ' ' + array[0]);
                if(checkLecturer(array[1])){
                    lectureT.setDetails(string + ' ' + array.shift());
                }else{
                    //console.log(string);
                    lectureT.setLecture_Name(string);
                }
                recursiveEvents(lectureT, '', array, course, day, callback);
            }else if(array.length != 0 && checkLecturer(array[0])){

                if(array[0].match(/[a-z]+\.+[a-z]+\//i)){
                    recursiveEvents(lectureT, string, array, course, day, callback);
                }else{
                    lectureT.setDetails(string);
                    recursiveEvents(lectureT, '', array, course, day, callback);
                }
            }else{
                recursiveEvents(lectureT, string, array, course, day, callback);
            }
        }else{

            if((string.match(/!!/) && array[0] == '!!') || string.match(/!!!/)){
                recursiveEvents(lectureT, string, array, course, day, callback);
            }else if(string.match(/Analyse/)){
                lectureT.setLecture_Name(string);
                recursiveEvents(lectureT, '', array, course, day, callback);
            }else{
                lectureT.setDetails(string);
                recursiveEvents(lectureT, '', array, course, day, callback);
            }
        }

    }
}

function writeToJSON(){

    var myJSON = eval ("(" + JSON.stringify({buildings: buildings}) + ")");

     jsonfile.writeFile('json/' + file + '.json', myJSON, function(err) {
     console.log(err);
     });
}

function writeToICAL(groupL){

    var myJSON = (eval ("(" + JSON.stringify({buildings: buildings}) + ")"))['buildings'],
        icalEvents = [];

    for(var object in myJSON){
        var lecture = myJSON[object];
        var regEx = new RegExp(groupL, 'g');

        if(lecture.group != null && lecture.group.match(regEx)){
            addEvent(lecture);
        }else if(!lecture.group){
            addEvent(lecture);
        }

    fs.writeFile('../ical/' + file + '_groupe' + ((groupL) || '') + '.ics', wrapString(icalEvents.join()), function(err) {
        if(err) {
            console.log(err);
        } else {
            //console.log("The file was saved!");
        }
    });
}

    function addEvent(lecture){
        var event = new iCalEvent({
            offset: 0,
            start: dates[lecture.day] + 'T' + lecture.time_start,
            end: dates[lecture.day] + 'T' + lecture.time_end,
            summary: lecture.lecture_name,
            description: lecture.details,
            location: ((lecture.group) ? lecture.group.substr(7, 1) + ' | ' : '') + lecture.location,
            organizer: {
                name: lecture.lecturer
            },
            repeat: {
                frequency: 'WEEKLY',
                until: '20141219T225959Z'
            }
        });
        icalEvents.push(event.toString());
    }
}

//Wraps string with iCal
function wrapString(string){

    var result = '';

    result += 'BEGIN:VCALENDAR\r\n';
    result += 'VERSION:2.0\r\n';
    result += 'PRODID:' + this.id + '\r\n';
    result += string;
    result += 'END:VCALENDAR\r\n';

    return result;
}