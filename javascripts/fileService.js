(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('FileService', ['require', 'exports', 'module'], function(require, exports, module) {
    var FileService;
    FileService = (function() {

      function FileService(ajaxHost) {
        this.ajaxHost = ajaxHost;
        this.getInfo = __bind(this.getInfo, this);
        this.writeFile = __bind(this.writeFile, this);
        this.readFile = __bind(this.readFile, this);
      }

      FileService.prototype.readFile = function(path, cb) {
        var _this = this;
        return this.ajaxHost.ajax({
          type: "GET",
          url: path,
          success: cb,
          error: (function(jqXHR, textStatus) {
            return console.log(textStatus);
          })
        });
      };

      FileService.prototype.writeFile = function(path, content, cb) {
        var _this = this;
        return this.ajaxHost.ajax({
          type: "POST",
          url: path,
          data: {
            content: content
          },
          success: cb,
          error: (function(jqXHR, textStatus) {
            return console.log(textStatus);
          })
        });
      };

      FileService.prototype.getInfo = function() {};

      return FileService;

    })();
    exports.FileService = FileService;
    return exports;
  });

}).call(this);
