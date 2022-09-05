/**
 * Generate Ajax Requests from Information in H5PIntegration Object to upload to LMS Storage.
 * Resulting URL will be public and stored in database via XAPI
 * based on core_h5p/h5p-editor-uploader.js
 * */

//
//import crypto from 'crypto'
import base64url from 'base64url'
import md5 from "blueimp-md5"

const FileUploader = (function () {

    function FileUploader(){}

    FileUploader.createToken = function(){

        function dec2hex (dec) {
            return dec.toString(16).padStart(2, "0")
          }
          
          // generateId :: Integer -> String
        function genrandom (len) {
        var arr = new Uint8Array((len || 40) / 2)
        window.crypto.getRandomValues(arr)
        return Array.from(arr, dec2hex).join('')
        }

        //hashtoken
        var token = btoa(genrandom(15))
        console.log("TOKEN", token)

        //getTimeFactor
        var timeFactor = Math.ceil(Math.floor(new Date().getTime() / 1000) / (86400 / 2));
        console.log("timefactor", timeFactor, new Date().getTime())
     
        var hashedToken = md5('files' + timeFactor.toString() + token).split("").reverse().join("").substring(0, 16)
        console.log("HASEDTOKEN 1", hashedToken, hashedToken.length)
        hashedToken = hashedToken.split("").reverse().join("").substring(0, 13)

        console.log("HASEDTOKEN 2", hashedToken, hashedToken.length)

        return hashedToken
    }

    FileUploader.upload = function (file, filename) {
        var formData = new FormData();
        formData.append('file', file, filename);
        formData.append('field', JSON.stringify(field));
        formData.append('contentId', H5PEditor.contentId || 0);

        // Submit the form
        var request = new XMLHttpRequest();
        request.upload.onprogress = function (e) {
            if (e.lengthComputable) {
                self.trigger('uploadProgress', (e.loaded / e.total));
            }
        };
        request.onload = function () {
            var result;
            var uploadComplete = {
                error: null,
                data: null
            };

            try {
                result = JSON.parse(request.responseText);
            }
            catch (err) {
                H5P.error(err);
            }
        };

        request.open('POST', self.getAjaxUrl('files'), true);
        request.send(formData);
        self.trigger('upload');
    };

    const determineAllowedMimeTypes = function () {
        if (field.mimes) {
            return field.mimes.join(',');
        }

        switch (field.type) {
            case 'image':
                return 'image/jpeg,image/png,image/gif';
            case 'audio':
                return 'audio/mpeg,audio/x-wav,audio/ogg,audio/mp4';
            case 'video':
                return 'video/mp4,video/webm,video/ogg';
        }
    }

    FileUploader.getAjaxUrl = function (action, parameters) {
        var url = H5PIntegration.editor.ajaxPath + action;

        if (parameters !== undefined) {
            var separator = url.indexOf('?') === -1 ? '?' : '&';
            for (var property in parameters) {
                if (parameters.hasOwnProperty(property)) {
                    url += separator + property + '=' + parameters[property];
                    separator = '&';
                }
            }
        }

        return url;
    };

    FileUploader.prototype.constructor = FileUploader;

    return FileUploader
})

export default FileUploader
