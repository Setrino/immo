var iCalEvent = require('icalevent');
var fs = require('fs');

var event = new iCalEvent({
    offset: new Date().getTimezoneOffset(),
    start: '2014-03-20T02:00:00-05:00',
    summary: 'Priestly Duties',
    description: 'Home flu visit.',
    location: 'Casa',
    url: 'http://google.com/search?q=nacho+libre',
    organizer: {
        name: 'Nacho Libre',
        email: 'luchador@monastery.org'
    },
    repeat: {
        frequency: 'WEEKLY',
        until: '2014-05-30T02:00:00-05:00'
    }
});

var event2 = new iCalEvent({
    offset: new Date().getTimezoneOffset(),
    start: '2014-03-29T03:00:00-05:00',
    end: '2014-02-25T03:30:00-05:00',
    summary: 'Another Thing',
    description: 'Lecture will start',
    location: 'Casa',
    url: 'http://google.com/search?q=nacho+libre',
    organizer: {
        name: 'Nacho Libre',
        email: 'luchador@monastery.org'
    }
});

fs.writeFile("ical/test.ics", wrapString(event.toString() + event2.toString()), function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
});

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

//Format
function writeToICS(){

}