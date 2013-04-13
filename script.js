
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'displaySubtitles') {
        
        // Constant
        var
            SUB_REFRESH_TIME    = 100
        ;

        var
            dialogHeight    = 200,
            dialogWidth     = 400,
            currentSubtitle = 0,
            currentTimer    = 0,
            subSpeed        = 102,
            timer           = null,
            subtitles       = null
        ;
        
        chrome.extension.sendMessage({localStorage: 'subtitles'}, function(response) {
            subtitles = JSON.parse(response);
            loadSubtitles(subtitles);

            var hideTimer = false;
            
            if(document.URL.match('^http://www.cucirca.com')) {
                dialogWidth = 590;
                dialogHeight = 330;
            }

            $('<div>')
                .attr('title', 'Subtitles')
                .attr('id', 'subtitle-dialog')
                .appendTo('body')
                .append(
                    $('<div>')
                        .attr('id', 'subtitle-bar-text')
                )
                .append(
                    $('<div>')
                        .attr('id', 'subtitle-controls')
                        .append(
                            $('<button>')
                                .attr('id', 'subtitle-bar-prev')
                                .html('previous')
                                .button({
                                    text: false,
                                    icons: {
                                        primary: "ui-icon-seek-prev"
                                    }
                                })
                        )
                        .append(
                            $('<button>')
                                .attr('id', 'subtitle-bar-play')
                                .html('play')
                                .button({
                                    text: false,
                                    icons: {
                                        primary: "ui-icon-play"
                                    }
                                })
                        )
                        .append(
                            $('<button>')
                                .attr('id', 'subtitle-bar-next')
                                .html('next')
                                .button({
                                    text: false,
                                    icons: {
                                        primary: "ui-icon-seek-next"
                                    }
                                })
                        )
                        .append(
                            $('<input>')
                                .attr('id', 'subtitle-bar-time')
                                .attr('type', 'text')
                                .attr('class', 'subtitle_time')
                                .timepicker({
                                    timeFormat: 'HH:mm:ss',
                                    showSecond: true,
                                    onClose: function() {
                                        var time = $(this).val().split(':');
                                        var timeMs = ((parseInt(time[0]) * 3600000) + (parseInt(time[1]) * 60000) + (parseInt(time[2]) * 1000));
                                        var lastEndTime = 0;
                                        
                                        for (var i = 0; i < subtitles.length; i++) {
                                            if (timeMs > subtitles[i].startTime && timeMs < subtitles[i].stopTime) {
                                                subtitleGoTo(i, true);
                                                i = subtitles.length;
                                            } else if (timeMs <= lastEndTime) {
                                                subtitleGoTo(i - 1, true);
                                                i = subtitles.length;
                                            } else {
                                                lastEndTime = subtitles[i].stopTime;
                                            }
                                        }
                                        
                                    }
                                })
                        )
                        .append(
                            $('<input>')
                                .attr('id', 'subtitle-bar-speed')
                                .attr('type', 'number')
                                .attr('class', 'subtitle_speed')
                                .attr('value', subSpeed)
                        )
                        .append(
                            $('<input>')
                                .attr('id', 'subtitle-file')
                                .attr('type', 'file')
                        )
                        .append(
                            $('<div>')
                                .attr('id', 'subtitle-slider')
                                .slider({
                                    min: 0,
                                    max: subtitles.length,
                                    range: 1,
                                    value: 0,
                                    slide: function(event, ui) {
                                        subtitleGoTo(ui.value, true);
                                        $('#subtitle-text').html(subtitles[currentSubtitle].text);
                                    }
                                })
                        )
                )
                .append(
                    $('<div>')
                        .attr('id', 'subtitle-text')
                        .attr('class', 'subtitle_text')
                )
                .dialog({
                    show: {
                        effect: 'fadeIn',
                        complete: function() {
                            $('#subtitle-dialog').parent('div').css('background', 'none');
                            $('#subtitle-dialog').parent('div').css('background-color', 'rgba(0, 0, 0, 0.05)');
                            $(this).mouseenter(function() {
                                clearTimeout(hideTimer);
                                $('#subtitle-dialog').parent('div').children('div.ui-dialog-titlebar').fadeTo('slow', '1');
                                $('#subtitle-controls').fadeTo('slow', '1');
                            })
                            .mouseleave(function() {
                                hideTimer = setTimeout(function(){
                                    $('#subtitle-dialog').parent('div').children('div.ui-dialog-titlebar').hide('slow');
                                    $('#subtitle-controls').hide('slow');
                                }, 2000);
                            });
                        }
                    },
                    minWidth: 400,
                    height: dialogHeight,
                    width: dialogWidth
                });
                
            $('#subtitle-bar-play').live('click', function() {
                var options;
                if ($(this).text() === "play") {
                    options = {
                        label: "pause",
                        icons: {
                            primary: "ui-icon-pause"
                        }
                    };
                    timer.play();
                } else {
                    options = {
                        label: "play",
                        icons: {
                            primary: "ui-icon-play"
                        }
                    };
                    timer.pause();
                }
                $(this).button("option", options);
            });

            $('#subtitle-bar-prev').live('click', function() {
                subtitleGoTo(currentSubtitle - 1, true);
            });

            $('#subtitle-bar-next').live('click', function() {
                subtitleGoTo(currentSubtitle + 1, true);
            });

            $('#subtitle-bar-speed').live('change', function() {
                subSpeed = $(this).val();
            });
            
            $('#subtitle-bar-time').live('change', function() {
                
            });
            
            $('#subtitle-file').live('change', function() {
                var file = document.getElementById('subtitle-file').files[0];
                
                if (file) {
                    var reader = new FileReader();
                    reader.readAsText(file, "UTF-8");
                    reader.onload = function(evt) {
                        var subs = parseSrt(evt.target.result);
                        localStorage.setItem('subtitles', JSON.stringify(subs));
                        localStorage.setItem('filename', file.name);
                        loadSubtitles(subs);
                    };
                }
            });

            /**
             * Go to the subtitles defined by the index
             * 
             * @param {int} index
             * @param {int} updateTimer
             * @returns {int} currentTimer
             */
            function subtitleGoTo(index, updateTimer) {
                currentSubtitle = index;
                $('#subtitle-slider').slider('value', index);
                if (updateTimer) {
                    currentTimer = subtitles[index].startTime;
                }
                
                return currentTimer;
            }
            
            /**
             * 
             * @param {string} subs
             * @returns {timer} timer
             */
            function loadSubtitles(subs) {
                
                subtitles = subs;
                
                timer = $.timer(function() {

                    if (parseInt(subtitles[currentSubtitle].startTime) < currentTimer) {
                        if (parseInt(subtitles[currentSubtitle].stopTime) > currentTimer) {
                            $('#subtitle-text').html(subtitles[currentSubtitle].text);
                        } else {
                            subtitleGoTo(currentSubtitle + 1, false);
                        }
                    } else {
                        $('#subtitle-text').html('');
                    }

                    currentTimer += parseInt(subSpeed);
                    $('#subtitle-bar-time').val(("0" + Math.floor(currentTimer / 36e5)).slice(-2) + ':' + ("0" + Math.floor((currentTimer % 36e5) / 6e4)).slice(-2) + ':' + ("0" + Math.floor((currentTimer % 6e4) / 1000)).slice(-2));

                }, SUB_REFRESH_TIME, false);
                
                return timer;
            }

            /**
             * Parse .srt file and return subtitles in a JSON format.
             *
             * @param srtString String from .srt file
             * @return array Subtitles
             */
            function parseSrt(srtString) {
               var lines = srtString.split('\n');
               var subs = [];


               var SRT_STATE_SUBNUMBER = 0;
               var SRT_STATE_TIME = 1;
               var SRT_STATE_TEXT = 2;
               var SRT_STATE_BLANK = 3;

               var state = SRT_STATE_SUBNUMBER;
               var subNum  = 0;
               var subText = '';
               var subTime = '';
               var subTimes = '';

               for (var i = 0; i < lines.length; i++) {
                   switch(state) {
                       case SRT_STATE_SUBNUMBER:
                           subNum = lines[i].trim();
                           state  = SRT_STATE_TIME;
                           break;

                       case SRT_STATE_TIME:
                           subTime = lines[i].trim();
                           state   = SRT_STATE_TEXT;
                           break;

                       case SRT_STATE_TEXT:
                           if (lines[i].trim() === '' && subTime.indexOf(' --> ') !== -1) {
                               subTimes = subTime.split(' --> ');

                               subs.push({
                                   number: subNum,
                                   startTime: (parseInt(subTimes[0].substr(0, 2), 10) * 3600000) + (parseInt(subTimes[0].substr(3, 2), 10) * 60000) + (parseInt(subTimes[0].substr(6, 2), 10) * 1000) + parseInt(subTimes[0].substr(9, 3), 10),
                                   stopTime: (parseInt(subTimes[1].substr(0, 2), 10) * 3600000) + (parseInt(subTimes[1].substr(3, 2), 10) * 60000) + (parseInt(subTimes[1].substr(6, 2), 10) * 1000) + parseInt(subTimes[1].substr(9, 3), 10),
                                   text: subText
                               });
                               subText = '';
                               state = SRT_STATE_SUBNUMBER;
                           } else {
                               if (subText.length > 0) {
                                   subText += '\n';
                               }
                               subText += lines[i];
                           }
                           break;
                   }
               }

               return subs;
            }

        });
        
    }
});
