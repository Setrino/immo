$(document).ready(function() {

        //start ajax request
        $.ajax({
            url: "json/buildings.json",
            //force to handle it as text
            dataType: "text",
            success: function(data) {
                
                //data downloaded so we call parseJSON function 
                //and pass downloaded data
                var json = $.parseJSON(data);
                //now json variable contains data in json format
                //let's display a few items
                console.log(json);
                buildHtmlTable(json['buildings']);
            },error: function(XMLHttpRequest, textStatus, errorThrown) {
                alert(textStatus+" - "+errorThrown);
            }
        });
});

// all records

// Builds the HTML Table out of myList.
function buildHtmlTable(myList) {
    var columns = addAllColumnHeaders(myList);

    for (var i = 0 ; i < myList.length ; i++) {
        var row$ = $('<tr/>');
        for (var colIndex = 0 ; colIndex < columns.length ; colIndex++) {
            var cellValue = myList[i][columns[colIndex]];

            //console.log(cellValue.array);

            if(cellValue.array)
                $.each(cellValue.array, function(i, v){
                    row$.append($('<td/>').html(i + ' ' + v));
                });
            else if(cellValue.agency){
                $.each(cellValue.agency, function(i, v){
                    row$.append($('<td/>').html(i + ' ' + v));
                });
            }

            if (cellValue == null) { cellValue = ""; }

            //row$.append($('<td/>').html(cellValue));
        }
        $("#buildings").append(row$);
    }
}

function addAllColumnHeaders(myList){

    var columnSet = [];
    var headerTr$ = $('<tr/>');

    for (var i = 0 ; i < myList.length ; i++) {
        var rowHash = myList[i];
        for (var key in rowHash) {
            if ($.inArray(key, columnSet) == -1){
                columnSet.push(key);
                headerTr$.append($('<th/>').html(key));
            }
        }
    }
    $("#buildings").append(headerTr$);

    return columnSet;
}

// Adds a header row to the table and returns the set of columns.
// Need to do union of keys from all records as some records may not contain


var jsonEvents = function(callback, filename){

    this.value = {};
    this.cal = null;
    this.requestJSON(callback, filename);
}

jsonEvents.prototype = {

    setValue: function(value){
        this.value = value;
    },

    setCal: function(cal){
        this.cal = cal;
    },

    getCal: function(){
        return this.cal;
    },

    requestJSON: function(callback, filename){
            $.ajax({
            url: "json/" + filename + ".json",
            //force to handle it as text
            dataType: "text",
            success: function(data) {
                
                //data downloaded so we call parseJSON function 
                //and pass downloaded data
                //var json = $.parseJSON(data);
                //now json variable contains data in json format
                //let's display a few items
                //$('#results').html('Plugin name: ' + json.author[3].name + '<br />' +
                //    'Author: ' + json.author[3].label);
                this.value = $.parseJSON(data);
                callback(this.value);
            },error: function(XMLHttpRequest, textStatus, errorThrown) {
                alert(textStatus+" - "+errorThrown);
                return null;
            }
        });
    }
}