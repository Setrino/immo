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
    var url = 'http://www.immostreet.ch/en/SearchEngine/Rent/Switzerland/All?AreaId=8c79c6b5-b61a-45f9-8560-91ae4825ac6a&AreaIdAgregate=8c79c6b5-b61a-45f9-8560-91ae4825ac6a&SearchCriteriaImmoId=766388da-719c-7644-cb71-8dcaf843cdeb';
    //var url = 'http://www.immostreet.ch/en/ItemDetails/Campaign/b878ec45-ddd9-4b7c-97de-46ce7b454590?returnUrl=%2fen%2fSearchEngine%2fRent%2fSwitzerland%2fAll%2fMonthlyRent_ASC%3fAreaId%3d8c79c6b5-b61a-45f9-8560-91ae4825ac6a%26AreaIdAgregate%3d8c79c6b5-b61a-45f9-8560-91ae4825ac6a%26SearchCriteriaImmoId%3daaa57780-f714-4be5-89a9-1d32145407f8%26resultPerPage%3d10';
    //var url = 'http://www.immostreet.ch/en/ItemDetails/Campaign/3506fc05-2afc-4287-b010-252c73b1d44a?returnUrl=%2fen%2fSearchEngine%2fRent%2fSwitzerland%2fAll%2fMonthlyRent_ASC%3fAreaId%3d8c79c6b5-b61a-45f9-8560-91ae4825ac6a%26AreaIdAgregate%3d8c79c6b5-b61a-45f9-8560-91ae4825ac6a%26PropertySubTypeGroupID%3d1%2c10%2c11%2c12%2c13%2c14%2c15%2c16%2c17%2c18%2c19%2c20%2c4%2c5%2c6%2c7%2c8%2c9%26CurrencyID%3dCHF%26SearchCriteriaImmoId%3dd04d4da9-861d-f1a4-3088-5ee85b70cfe6%26resultPerPage%3d10';
    //384 - scale 10.1

    findEntriesNumber(url, function(number){
        var newUrl = url + '&p=' + number;
        console.log("Requesting...");
        request(newUrl, (function(course) { return function(err, resp, body) {
            $ = cheerio.load(body);
            if (!err && resp.statusCode == 200) {
                console.log("Received Main Page");
            }
            //Inner Page
            //innerBuilding($(".id_content .inner"), $), callback();
            //Main Page
            var entries = $("#search-engine_list > div");
            var entriesCounter = 0;
            $(entries).each(function(day){
                if($(this).attr('id') != 'undefined' &&
                    !$(this).attr('class').match('__no-print')){
                    entriesCounter++;
                    var link = uri + $(this).find('.classified_thumb').children('a').attr('href');
                    request(link, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            //console.log(body);
                            $ = cheerio.load(body);
                            innerBuilding($(".id_content .inner"), $);
                        }
                    });
                }
            }), timedCallback(entriesCounter);
        }})(courseId));
    });
}

findEntriesNumber = function(link, callback){
    request(link, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);
            var resultsNo = (trim($(".search-title_num-of-results").html())).replace(',', '');
            resultsNo = parseInt(resultsNo.substring(0, resultsNo.indexOf('res')));
            console.log("Results " + resultsNo);
            callback(Math.floor(resultsNo / 10.16));
        }
    });
};

timedCallback = function(entriesLength){
    console.log("Counted entries " + entriesLength);
    var checker = function(){
        if(entriesLength == buildings.length) {
            writeToJSON();
            clearInterval(timer);
        }
    };
    var timer = setInterval(checker, 5000);
}

async.each(courseIds, perCourse, function (err) {
    // Executed after for loop finished;
    //setTimeout(writeToJSON, 10000);
});


//Building Object
//dublicate - array for dublicate elements. [location, group]
function Building(){

    this.gallery = {};
    this.summary = {
                    price: String,
                    subtype: String,
                    address: String,
                    immocode: String,
                    available: String
                    };
    this.description = {
                    title: String,
                    details: String
                    }
    this.features = {
                    title: String,
                    array: {}
                    };
    this.facilities = {
                    title: String,
                    array: {}
                    };
    this.exposition = {
                    title: String,
                    array: {}
                    };
    this.view = {
                    title: String,
                    array: {}
                    };
    this.environment = {
                    title: String,
                    array: {}
                    };
    this.proximity = {
                    title: String,
                    array: {}
                    };
    this.activities = {
                    title: String,
                    array: {}
                    };
    this.location = {
                    title: String,
                    address: String
                    };
    this.contact = {
                    title: String,
                    agency: {
                        link: String,
                        logo: String,
                        name: String,
                        address: String,
                        city: String,
                        phone: String,
                        fax: String
                            },
                    company: {
                        person: String,
                        phone: String
                             },
                    visit:   {
                        person: String,
                        phone: String
                             }
                    };
}

//current - current event object, lecture
//string - temporary string for the searched path
//array - event array
//callback - function

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

        if(not_allowed.indexOf(that.attr('class')) == -1){

            switch(that.attr('class')){
                case 'row row__drop __no-gutters __no-print' :
                    //console.log($(this).attr());
                    $(that.find('.id_gallery_image a')).each(function(i){
                        building.gallery[i] = (trim($(this).attr('href')));
                    });
                    building.summary.price = trim(that.find(".id_summary_title_price").html());
                    building.summary.subtype = trim(that.find(".id_summary_title_subtype").html());
                    building.summary.address = trim(that.find(".id_summary_address").html());
                    building.summary.immocode = trim(that.find(".id_immocode_value").html());
                    building.summary.available = trim(that.find(".id_highlights_item_value").html());
                    break;
                case 'id_description' :
                    building.description.title = trim(that.find('.id_title').html());
                    building.description.details = trim(that.find('.id_description').html());
                    break;
            };

            switch(that.attr('id')){
                case 'id_features' :
                    building.features.title =  that.find('.id_properties_title').html();
                    $(that.find('.id_label-value_item')).each(function(){
                        building.features.array[$(this).children('.id_label-value_item_label').html()] =
                            $(this).children('.id_label-value_item_value').html();
                    });
                    break;
                case 'id_facilities' :
                    building.facilities.title =  $(this).find('.id_properties_title').html();
                    $(that.find('.id_properties_item')).each(function(i){
                        building.facilities.array[i] = (trim($(this).children('.id_check_item_value').html()));
                    });
                    break;
                case 'id_exposition' :
                    building.exposition.title =  $(this).find('.id_properties_title').html();
                    $(that.find('.id_properties_item')).each(function(i){
                        building.exposition.array[i] = (trim($(this).children('.id_check_item_value').html()));
                    });
                    break;
                case 'id_view' :
                    building.view.title =  $(this).find('.id_properties_title').html();
                    $(that.find('.id_properties_item')).each(function(i){
                        building.view.array[i] = (trim($(this).children('.id_check_item_value').html()));
                    });
                    break;
                case 'id_environment' :
                    building.environment.title =  $(this).find('.id_properties_title').html();
                    $(that.find('.id_properties_item')).each(function(i){
                        building.environment.array[i] = (trim($(this).children('.id_check_item_value').html()));
                    });
                    break;
                case 'id_proximity' :
                    building.proximity.title =  $(this).find('.id_properties_title').html();
                    $(that.find('.id_properties_item')).each(function(i){
                        building.proximity.array[i] = (trim($(this).children('.id_check_item_value').html()));
                    });
                    break;
                case 'id_activities' :
                    building.activities.title =  $(this).find('.id_properties_title').html();
                    $(that.find('.id_properties_item')).each(function(i){
                        building.activities.array[i] = (trim($(this).children('.id_check_item_value').html()));
                    });
                    break;
                case 'id_location' :
                    building.location.title =  trim(that.find('.id_properties_title').html());
                    building.location.address = trim(that.find('#id_location_panels_street-view').attr('data-address'));
                    break;
                case 'id_contact_stripe' :
                    contactForm(that, building, $);
                    //#id_contact_stripe > div > div > div > div.col-8.tcol-6.pcol-12 > div > div.id_agency > div > div:nth-child(2)
                    break;
            }
        }
    });
    console.log('No of pages parsed '+ buildings.length);
    buildings.push(building);
}

function contactName($, key){
    return (key.length > 1 && !(key.html()).match(/Telep/g) && !(key.html()).match(/Location/g))
        ? trim($(key[0]).html()) : null;
}

function extractPhone(string, $){
    return (string != null) ? trim(string.html()) : null;
}

function substring(string, from, to){
    return string.substring(from, to || string.length);
}

function trim(string){
    return (string != null) ? string.trim() : null;
}

function contactForm(that, building, $){

    building.contact.title = trim(that.find('.id_properties_title').html());
    building.contact.agency.link = that.find('.id_agency_logo_link').attr('href');
    building.contact.agency.logo = that.find('.id_agency_logo_link_img').attr('src');
    building.contact.agency.reference = substring(trim(that.find('.row p:nth-child(2)').html()), 11);

    var p = that.find('.id_agency > div > div:last-child').children('p');

    if(p.length > 1){
        building.contact.agency.name = null;
        building.contact.agency.address = trim($(p[1]).html());
        building.contact.agency.city = trim($(p[2]).html());
        building.contact.agency.phone = trim($(p[3]).find('#ami-business-unit-phone-print').html());
        building.contact.agency.fax = null;
    }else{
        building.contact.agency.name = trim(that.find('.row div:nth-child(2) p span:first-child').html());
        building.contact.agency.address = trim(that.find('.row div:nth-child(2) p span.address1').html());
        building.contact.agency.city = trim(that.find('.row div:nth-child(2) p span:nth-child(5)').html());
        building.contact.agency.phone = trim(that.find('#business-unit-phone-print').html());
        building.contact.agency.fax = trim(that.find('#business-unit-fax-print').html());
    }

    building.contact.company.person = contactName($, that.find('#campaign_connection_contact span'));
    building.contact.company.phone = extractPhone(that.find('#campaign_connection_contact span:last-child'), $);
    building.contact.visit.person = contactName($, that.find('.campaign_connection_visit-contact span'));
    building.contact.visit.phone = trim(that.find('#visit-contact-phone-print').html());
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