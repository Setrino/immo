function DropDown(el, callback) {
    this.dd = el;
    this.placeholder = this.dd.children('span');
    this.opts = this.dd.find('ul.dropdown > li');
    this.firstText = this.dd.find('ul.dropdown > li:last-child').text();
    this.val = '';
    this.index = -1;
    this.initEvents(callback);
}

DropDown.prototype = {
    initEvents : function(callback) {
        var obj = this;

        obj.dd.on('click', function(event){
            $(this).toggleClass('active');
            return false;
        });

        obj.opts.on('click',function(){
            var opt = $(this);
            obj.val = opt.text();
            obj.index = opt.index();
            obj.placeholder.text(obj.val);
            new jsonEvents(function(value) { json.getCal().setJSON(value); }, requestFilename(obj.placeholder.text()));
        });

        $('.json_file').on('click', function(){
            window.location = 'json/' + requestFilename(obj.placeholder.text()) + '.json';
        });

        $('.ical_file').on('click', function(){

            if($( '#groups .groupA' ).is(".line-through") && $( '#groups .groupC' ).is(".line-through")){
                window.location = 'ical/' + requestFilename(obj.placeholder.text()) + '_groupeB.ics';
            }else if($( '#groups .groupB' ).is(".line-through") && $( '#groups .groupC' ).is(".line-through")){
                window.location = 'ical/' + requestFilename(obj.placeholder.text()) + '_groupeA.ics';
            }else if($( '#groups .groupB' ).is(".line-through") && $( '#groups .groupA' ).is(".line-through")){
                window.location = 'ical/' + requestFilename(obj.placeholder.text()) + '_groupeC.ics';
            }
        });

        obj.placeholder.text(obj.firstText);

            var json = new jsonEvents(function(value) {

                var cal = $( '#calendar' ).calendario( {
                        onDayClick : function( $el, $contentEl, dateProperties ) {

                            for( var key in dateProperties ) {
                            }
                            if( $contentEl.length > 0 && ($(window).width() > 880 && $(window).height() > 450)) {
                                showEvents( $contentEl, dateProperties );
                            }

                        },
                        caldata : codropsEvents,
                        jsonEvents : value
                    } ),
                    $month = $( '#custom-month' ).html( cal.getMonthName() ),
                    $year = $( '#custom-year' ).html( cal.getYear() );

                $( '#custom-next' ).on( 'click', function() {
                    cal.gotoNextMonth( updateMonthYear );
                } );
                $( '#custom-prev' ).on( 'click', function() {
                    cal.gotoPreviousMonth( updateMonthYear );
                } );
                $( '#custom-current' ).on( 'click', function() {
                    cal.gotoNow( updateMonthYear );
                } );
                $( '#groups .groupA' ).on( 'click', function() {
                    updateGroup($(this), $('#groups .groupB'), $('#groups .groupC'));
                } );
                $( '#groups .groupB' ).on( 'click', function() {
                    updateGroup($(this), $('#groups .groupC'), $('#groups .groupA'));
                } );
                $( '#groups .groupC' ).on( 'click', function() {
                    updateGroup($(this), $('#groups .groupB'), $('#groups .groupA'));
                } );

                function updateMonthYear() {
                    $month.html( cal.getMonthName() );
                    $year.html( cal.getYear() );
                }

                function removeClass(clicked, array){
                    $(array).each(function(i, v){
                        if($(v).html() != clicked.html()){
                            $(v).removeClass("line-through");
                        }
                    });
                }

                function addClass(clicked, array){
                    $(array).each(function(i, v){
                        if($(v).html() != clicked.html()){
                            $(v).addClass("line-through");
                        }
                    });
                }

                function checkClass(clicked, array){
                    var temp = true;
                    $(array).each(function(i, v){
                        if($(v).html() != clicked.html()){
                            if($(v).hasClass("line-through")){
                                temp = temp && true;
                            }else{
                                temp = temp && false;
                            }
                        }
                    });
                    return temp;
                }

                function updateGroup(clicked, other, other2){
                    var array = $($('#groups').children());
                    if(!clicked.hasClass("line-through") && checkClass(clicked, array)){
                        clicked.removeClass("line-through");
                        setCookie("group","", 60);
                        removeClass(clicked, array);
                        cal.excludeGroup(updateMonthYear);
                    }
                    else{
                        var group2 = (other2) ? (other2.html()).substr(5, 2) : null;
                        setCookie("group",(clicked.html()).substr(6, 1), 60);
                        addClass(clicked, array);
                        clicked.removeClass("line-through");
                        cal.excludeGroup(updateMonthYear, (other.html()).substr(5, 2), group2);
                    }
                }

                json.setCal(cal);

                callback(updateGroup);

            }, requestFilename(obj.firstText))
    },
    getValue : function() {
        return this.val;
    },
    getIndex : function() {
        return this.index;
    }
}

$(function() {

    var dd = new DropDown( $('#dd') , checkCookie);

    $(document).click(function() {
        // all dropdowns
        $('.wrapper-dropdown-3').removeClass('active');
    });

});

function waitForElement(){
    if($('.fc-today').offset() != undefined && $(window).width() <= 880){
        $(window).scrollTop($('.fc-today').offset().top - 20);
    }
    else{
        setTimeout(function(){
            waitForElement();
        },250);
    }
};

waitForElement();

function showEvents( $contentEl, dateProperties ) {

    var $wrapper = $('#custom-inner');

    hideEvents();

    var $events = $( '<div id="custom-content-reveal" class="custom-content-reveal"><h4>Events for ' +
            dateProperties.monthname + ' ' + dateProperties.day + ', ' + dateProperties.year +
            '</h4></div>'),
        $close = $( '<span class="custom-content-close"></span>' ).on( 'click', hideEvents );
    $events.append( "<div class='custom-content-text'></br>" + $contentEl.html() + '</div>' , $close ).insertAfter( $wrapper );
    $('#custom-content-reveal').css('height', $(".custom-content-text").height() + 63);


    setTimeout( function() {
        $events.css( 'top', '00%' );
    }, 25 );

}
function hideEvents() {

    var $events = $( '#custom-content-reveal'),
        transEndEventNames = {
            'WebkitTransition' : 'webkitTransitionEnd',
            'MozTransition' : 'transitionend',
            'OTransition' : 'oTransitionEnd',
            'msTransition' : 'MSTransitionEnd',
            'transition' : 'transitionend'
        },
        transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ];
    if( $events.length > 0 ) {

        $events.css( 'top', '100%' );
        Modernizr.csstransitions ? $events.on( transEndEventName, function() { $( this ).remove(); } ) : $events.remove();
    }
    //

}

function requestFilename(text){

    return 'bac' + text.substr(9, 1) + text.substr(11, 1).toLowerCase();
}

function getCookie(c_name)
{
    var c_value = document.cookie;
    var c_start = c_value.indexOf(" " + c_name + "=");
    if (c_start == -1)
    {
        c_start = c_value.indexOf(c_name + "=");
    }
    if (c_start == -1)
    {
        c_value = null;
    }
    else
    {
        c_start = c_value.indexOf("=", c_start) + 1;
        var c_end = c_value.indexOf(";", c_start);
        if (c_end == -1)
        {
            c_end = c_value.length;
        }
        c_value = decodeURI(c_value.substring(c_start,c_end));
    }
    return c_value;
}

function setCookie(c_name,value,exdays)
{
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + 60);
    var c_value= encodeURI(value) + ((exdays == null) ? "" : "; expires="+exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
}

function checkCookie(callback)
{

    var group = getCookie("group");
    if (group != null && group != "") {

        if(group == 'A'){
            callback($( '#groups .groupA' ), $( '#groups .groupB' ));
        }else if(group == 'B'){
            callback($( '#groups .groupB' ), $( '#groups .groupA' ));
        }else if(group == 'C'){

        }
    }
}