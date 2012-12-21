
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == 'displaySubtitles') {
        
        chrome.extension.sendMessage({localStorage: 'subtitles'}, function(response) {
            var subtitles = JSON.parse(response);
            var currentSubtitle = 0;

            var subRefreshTime = 100; // Determine subtitles refresh time (in milliseconds)
            var subSpeed = 102;
            var currentTimer = 0;
            var timer = $.timer(function() {

                if (parseInt(subtitles[currentSubtitle].startTime) < currentTimer) {
                    if (parseInt(subtitles[currentSubtitle].stopTime) > currentTimer) {
                        $('#subtitle-text').html(subtitles[currentSubtitle].text);
                    } else {
                        subtitleGoTo(currentSubtitle + 1, false)
                    }
                } else {
                    $('#subtitle-text').html('');
                }

                currentTimer += parseInt(subSpeed);
                $('#subtitle-bar-time').val(("0" + Math.floor(currentTimer / 36e5)).slice(-2) + ':' + ("0" + Math.floor((currentTimer % 36e5) / 6e4)).slice(-2) + ':' + ("0" + Math.floor((currentTimer % 6e4) / 1000)).slice(-2));
                
            }, subRefreshTime, false);

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
                            $('<button>')
                                .attr('id', 'subtitle-bar-light')
                                .html('fade')
                                .button({
                                    text: false,
                                    icons: {
                                        primary: "ui-icon-lightbulb"
                                    }
                                })
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
                )
                .append(
                    $('<div>')
                        .attr('id', 'subtitle-text')
                        .attr('class', 'subtitle_text')
                )
                .dialog({
                    show: {
                        effect: 'slide',
                        complete: function() {
                            $('#subtitle-dialog').parent('div').css('background', 'none');
                            $('#subtitle-dialog').parent('div').css('background-color', 'rgba(0, 0, 0, 0.05)');
                        }
                    },
                    minWidth: 400
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
                subtitleGoTo(currentSubtitle - 1, true)
            });

            $('#subtitle-bar-next').live('click', function() {
                subtitleGoTo(currentSubtitle + 1, true)
            });

            $('#subtitle-bar-speed').live('change', function() {
                subSpeed = $(this).val();
            });
            
            $('#subtitle-bar-time').live('change', function() {
                
            });

            $('#subtitle-bar-light').live('click', function() {
                if ($('#subtitle-controls').css('opacity') != '1') {
                    $('#subtitle-dialog').parent('div').children('div.ui-dialog-titlebar').fadeTo('slow', '1');
                    $('#subtitle-controls').fadeTo('slow', '1');
                } else {
                    $('#subtitle-dialog').parent('div').children('div.ui-dialog-titlebar').fadeTo('slow', '0.2');
                    $('#subtitle-controls').fadeTo('slow', '0.2');
                }
            });

            function subtitleGoTo(index, updateTimer) {
                currentSubtitle = index;
                $('#subtitle-slider').slider('value', index);
                if (updateTimer) {
                    currentTimer = subtitles[index].startTime;
                }
            }

        });
        
    }
});
