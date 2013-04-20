
$(document).ready(function() {
    
    if (localStorage.getItem('filename')) {
        $('#file-loaded').html(localStorage.getItem('filename'));
    }
    
    $('#save-btn').live('click', function() {
        var file = document.getElementById('subtitle-file').files[0];
        
        if (file) {
            var reader = new FileReader();
            reader.readAsText(file, "UTF-8");
            reader.onload = function(evt) {
                var subs = parseSrt(evt.target.result);
                var filename = document.getElementById('subtitle-file').value.split('\\').pop();
                localStorage.setItem('subtitles', JSON.stringify(subs));
                localStorage.setItem('filename', filename);
                $('#file-loaded').html(localStorage.getItem('filename'));
            };
        }
    });
    
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
