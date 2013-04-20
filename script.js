
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'displaySubtitles' && !$('#subtitle-dialog').length) {
        
        // Constant
        var
            SUB_REFRESH_TIME    = 100
        ;

        var
            currentSubtitle = 0,
            currentTimer    = 0,
            subSpeed        = 102,
            timer           = null,
            filename        = null,
            subtitles       = new Array()
        ;
        
        chrome.extension.sendMessage({getLocalStorage: 'subtitles'}, function(response) {
            if (response) {
                subtitles = JSON.parse(response);
                loadSubtitles(subtitles);
                chrome.extension.sendMessage({getLocalStorage: 'filename'}, function(response) {
                    filename = response;
                    $('#subtitle-text').html(
                        $('<span>')
                            .attr('class', 'subtitle_file_ok')
                            .html(filename)
                    );
                });
            }

            var hideTimer = false;
            
            // Handle websites
            if(document.URL.match('^http://www.cucirca.com')) {
                
            }

            $('<div>')
                .attr('title', 'Subtitles')
                .attr('id', 'subtitle-dialog')
                .attr('class', 'subtitle_dialog')
                .draggable({ handle: 'span.subtitle_drag_handle' })
                .resizable({ handles: 'e' })
                .center()
                .appendTo('body')
                .append(
                    $('<div>')
                        .attr('id', 'subtitle-tiny-bar')
                        .attr('class', 'subtitle_tiny_bar')
                        .append(
                            $('<div>')
                                .attr('id', 'subtitle-text')
                                .attr('class', 'subtitle_text')
                        )
                        .append(
                            $('<span>')
                                .attr('class', 'subtitle_drag_handle subtitle_tiny_bar_btn')
                                .html('handle')
                                .button({
                                    text: false,
                                    icons: {
                                        primary: "ui-icon-grip-dotted-vertical"
                                    }
                                }).css('cursor', 'move')
                        )
                )
                .append(
                    $('<div>')
                        .attr('id', 'subtitle-controls')
                        .attr('class', 'subtitle_controls')
                        .hide()
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
                                    }
                                })
                        )
                );
            
            $('#subtitle-dialog').on('click', '#subtitle-bar-play', function() {
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
            
            /**
             * Show / Hide controls
             */
            $(document).on({
                mouseenter: function() {
                    clearTimeout(hideTimer);
                    $('#subtitle-controls').slideDown();
                    $('#subtitle-tiny-bar').children().not('#subtitle-text').fadeTo('fast', 1);
                },
                mouseleave: function() {
                    hideTimer = setTimeout(function() {
                        $('#subtitle-controls').slideUp();
                        $('#subtitle-tiny-bar').children().not('#subtitle-text').fadeTo('fast', 0.2);
                    }, 2000);
                }
            }, '#subtitle-dialog');
            
            $(document).keydown(function(e) {
                if (e.shiftKey) {
                    switch (e.which) {
                        case 80: // P
                            $('#subtitle-bar-play').trigger('click');
                            break;
                        case 38: // Arrow Up
                            subSpeed++;
                            $('#subtitle-bar-speed').val(subSpeed);
                            break;
                        case 40: // Arrow Down
                            subSpeed--;
                            $('#subtitle-bar-speed').val(subSpeed);
                            break;
                        case 37: // Arrow Left
                            $('#subtitle-bar-prev').trigger('click');
                            break;
                        case 39: // Arrow Right
                            $('#subtitle-bar-next').trigger('click');
                            break;
                    }
                }
            });

            $('#subtitle-dialog').on('click', '#subtitle-bar-prev', function() {
                subtitleGoTo(currentSubtitle - 1, true);
            });

            $('#subtitle-dialog').on('click', '#subtitle-bar-next', function() {
                subtitleGoTo(currentSubtitle + 1, true);
            });

            $('#subtitle-dialog').on('change', '#subtitle-bar-speed', function() {
                subSpeed = $(this).val();
            });
            
            $('#subtitle-dialog').on('change', '#subtitle-bar-time', function() {
                
            });
            
            $('#subtitle-dialog').on('change', '#subtitle-file', function() {
                var file = document.getElementById('subtitle-file').files[0];
                
                if (file) {
                    var reader = new FileReader();
                    reader.readAsText(file, "UTF-8");
                    reader.onload = function(evt) {
                        var subs = parseSrt(evt.target.result);
                        chrome.extension.sendMessage({setLocalStorage: 'subtitles', value: JSON.stringify(subs)});
                        chrome.extension.sendMessage({setLocalStorage: 'filename', value: file.name});
                        loadSubtitles(subs);
                    };
                }
            });
            
            if (subtitles.length === 0) {
                $('#subtitle-text').html(
                        $('<span>')
                            .attr('class', 'subtitle_file_error')
                            .html('Invalid subs file!')
                    );
            }

            /**
             * Go to the subtitles defined by the index
             * 
             * @param {int} index
             * @param {int} updateTimer
             * @returns {int} currentTimer
             */
            function subtitleGoTo(index, updateTimer) {
                // Check if the subtitle index match a subtitle
                if (subtitles[index]) {
                    currentSubtitle = index;
                    $('#subtitle-slider').slider('value', index);
                    if (updateTimer) {
                        currentTimer = subtitles[index].startTime;
                        refreshTimer();
                        $('#subtitle-text').html(subtitles[currentSubtitle].text);
                    }
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
                    refreshTimer();

                }, SUB_REFRESH_TIME, false);
                
                return timer;
            }
            
            /**
             * Refresh timer input
             * 
             * @returns currentTimer
             */
            function refreshTimer() {
                $('#subtitle-bar-time').val(("0" + Math.floor(currentTimer / 36e5)).slice(-2) + ':' + ("0" + Math.floor((currentTimer % 36e5) / 6e4)).slice(-2) + ':' + ("0" + Math.floor((currentTimer % 6e4) / 1000)).slice(-2));
                
                return currentTimer;
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
        
    } else if (request.action === 'displaySubtitles' && $('#subtitle-dialog').length) {
        $('#subtitle-dialog').fadeToggle();
    }
});
