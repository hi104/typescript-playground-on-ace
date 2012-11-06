var AceRange = require('ace/range').Range;
var AutoComplete = require('autocomplete').AutoComplete;
var lang = require("ace/lib/lang");
var EditorPosition =  require('EditorPosition').EditorPosition;
var CompilationService =  require('CompilationService').CompilationService;
var FileService =  require('FileService').FileService;
var deferredCall = require("ace/lib/lang").deferredCall;

var Services = require('typescriptServices').Services;
var TypeScript = require('typescriptServices').TypeScript;
var TypeScriptLS = require('lightHarness').TypeScriptLS;

var aceEditorPosition = null;
var appFileService = null;
var editor = null;
var outputEditor = null;
var typeCompilationService = null;
var docUpdateCount = 0;
var typeScriptLS =  new TypeScriptLS();
var ServicesFactory = new Services.TypeScriptServicesFactory();
var serviceShim = ServicesFactory.createLanguageServiceShim(typeScriptLS);

var selectFileName = "";

var syncStop = false; //for stop sync on loadfile
var autoComplete = null;
var refMarkers = [];

function loadTypeScriptLibrary(){
    var libnames = [
        "typescripts/lib.d.ts"
    ];

    libnames.forEach(function(libname){
        appFileService.readFile(libname, function(content){
            typeScriptLS.addScript(libname, content.replace(/\r\n?/g,"\n"), true);
        });
    });
}

function loadFile(filename) {
    appFileService.readFile(filename, function(content){
        selectFileName = filename;
        syncStop = true;
        var data= content.replace(/\r\n?/g,"\n");
        editor.setValue(data);
        editor.moveCursorTo(0, 0);
        typeScriptLS.updateScript(filename, editor.getSession().getDocument().getValue() , false);
        syncStop = false;
    });
}

function startAutoComplete(editor){
    if (autoComplete.isActive() == false){
        autoComplete.setScriptName(selectFileName);
        autoComplete.active();
    }
}

function onUpdateDocument(e){
    if (selectFileName){
        if (!syncStop){
            syncTypeScriptServiceContent(selectFileName, e);
        }
    }
}

//sync LanguageService content and ace editor content
function syncTypeScriptServiceContent(script, aceChangeEvent){

    var data = aceChangeEvent.data;
    var action = data.action;
    var range = data.range;
    var start = aceEditorPosition.getPositionChars(range.start);

    if(action == "insertText"){
        editLanguageService(script, new Services.TextEdit(start , start, data.text));
    }else if(action == "insertLines"){

        var text = data.lines.map(function(line) {
            return line+ '\n'; //TODO newline hard code
        }).join('');
        editLanguageService(script,new Services.TextEdit(start , start, text));

    }else if (action == "removeText") {
        var end = start + data.text.length;
        editLanguageService(script, new Services.TextEdit(start, end, ""));
    }else if (action == "removeLines"){
        var len = aceEditorPosition.getLinesChars(data.lines);
        var end = start + len;
        editLanguageService(script, new Services.TextEdit(start, end, ""));
    }
};


function editLanguageService(name, textEdit){
    typeScriptLS.editScript(name, textEdit.minChar, textEdit.limChar, textEdit.text);
}

function onChangeCursor(e){
    if(!syncStop){
        try{
            deferredShowOccurrences.schedule(200);
        }catch (ex){
            //TODO
        }
    }
};

function languageServiceIndent(){
    var cursor = editor.getCursorPosition();
    var lineNumber = cursor.row;

    var text  = editor.session.getLine(lineNumber);
    var matches = text.match(/^[\t ]*/);
    var preIndent = 0;
    var wordLen = 0;

    if(matches){
        wordLen = matches[0].length;
        for(var i = 0; i < matches[0].length; i++){
            var elm = matches[0].charAt(i);
            var spaceLen = (elm == " ") ? 1: editor.session.getTabSize();
            preIndent += spaceLen;
        };
    }

    var option = new Services.EditorOptions();
    option.NewLineCharacter = "\n";

    var smartIndent = serviceShim.languageService.getSmartIndentAtLineNumber(selectFileName, lineNumber, option);

    if(preIndent > smartIndent){
        editor.indent();
    }else{
        var indent = smartIndent - preIndent;

        if(indent > 0){
            editor.getSelection().moveCursorLineStart();
            editor.commands.exec("inserttext", editor, {text:" ", times:indent});
        }

        if( cursor.column > wordLen){
            cursor.column += indent;
        }else{
            cursor.column = indent + wordLen;
        }

        editor.getSelection().moveCursorToPosition(cursor);
    }
}

function refactor(){
    var references = serviceShim.languageService.getOccurrencesAtPosition(selectFileName, aceEditorPosition.getCurrentCharPosition());

    references.forEach(function(ref){
        var getpos = aceEditorPosition.getAcePositionFromChars;
        var start = getpos(ref.ast.minChar);
        var end = getpos(ref.ast.limChar);
        var range = new AceRange(start.row, start.column, end.row, end.column);
        editor.session.multiSelect.addRange(range);
    });
}

function showOccurrences(){
    var references = serviceShim.languageService.getOccurrencesAtPosition(selectFileName, aceEditorPosition.getCurrentCharPosition());
    var session = editor.getSession();
    refMarkers.forEach(function (id){
        session.removeMarker(id);
    });
    references.forEach(function(ref){
        //TODO check script name
        // console.log(ref.unitIndex);
        var getpos = aceEditorPosition.getAcePositionFromChars;
        var start = getpos(ref.ast.minChar);
        var end = getpos(ref.ast.limChar);
        var range = new AceRange(start.row, start.column, end.row, end.column);
        refMarkers.push(session.addMarker(range, "typescript-ref", "text", true));
    });
}

var deferredShowOccurrences = deferredCall(showOccurrences);

function Compile(typeScriptContent){
    var output = "";

    var outfile = {
        Write: function (s) {
            output  += s;
        },
        WriteLine: function (s) {
            output  += s + "\n";
        },
        Close: function () {
        }
    };

    var outerr = {
        Write: function (s) {
        },
        WriteLine: function (s) {
        },
        Close: function () {
        }
    };
    var compiler = new TypeScript.TypeScriptCompiler(outfile, outerr, new TypeScript.NullLogger(), new TypeScript.CompilationSettings());
    compiler.addUnit(typeScriptContent, "output.js", false);
    compiler.typeCheck();
    compiler.emit(false, function (name) {

    });
    return output;
}

function workerOnCreate(func, timeout){
    if(editor.getSession().$worker){
        func(editor.getSession().$worker);
    }else{
        setTimeout(function(){
            workerOnCreate(func, timeout);
        });
    }
}

function javascriptRun(){
    var d = window.open("", "_blank");
    d.document.open();

    d.document.write('<html><head></head>'
                     + '<body>'
                     + '<script type="text/javascript">'
                     + Compile(editor.getSession().doc.getValue())
                     + '</script>'
                     + '</body></html>');
    d.document.close();
}

$(function(){
    appFileService = new FileService($);
    editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode('ace/mode/typescript');

    outputEditor = ace.edit("output");
    outputEditor.setTheme("ace/theme/monokai");
    outputEditor.getSession().setMode('ace/mode/javascript');
    document.getElementById('editor').style.fontSize='14px';
    document.getElementById('output').style.fontSize='14px';

    loadTypeScriptLibrary();
    loadFile("samples/greeter.ts");

    editor.addEventListener("change", onUpdateDocument);
    editor.addEventListener("changeSelection", onChangeCursor);

    editor.commands.addCommands([{
        name:"autoComplete",
        bindKey:"Ctrl-Space",
        exec:function(editor) {
            startAutoComplete(editor);
        }
    }]);

    editor.commands.addCommands([{
        name:"refactor",
        bindKey: "F2",
        exec:function(editor) {
            refactor();
        }
    }]);

    // editor.commands.addCommands([{
    //     name: "indent",
    //     bindKey: "Tab",
    //     exec: function(editor) {
    //         languageServiceIndent();
    //     },
    //     multiSelectAction: "forEach"
    // }]);

    aceEditorPosition = new EditorPosition(editor);
    typeCompilationService = new CompilationService(editor, serviceShim);
    autoComplete = new AutoComplete(editor, selectFileName, typeCompilationService);

    // override editor onTextInput
    var originalTextInput = editor.onTextInput;
    editor.onTextInput = function (text){
        originalTextInput.call(editor, text);
        if(text == "."){
            editor.commands.exec("autoComplete");

        }else if (editor.getSession().getDocument().isNewLine(text)) {
            var lineNumber = editor.getCursorPosition().row;
            var option = new Services.EditorOptions();
            option.NewLineCharacter = "\n";
            var indent = serviceShim.languageService.getSmartIndentAtLineNumber(selectFileName, lineNumber, option);
            if(indent > 0) {
                editor.commands.exec("inserttext", editor, {text:" ", times:indent});
            }
        }
    };

    editor.addEventListener("mousedown", function(e){
        if(autoComplete.isActive()){
            autoComplete.deactivate();
        }
    });

    editor.getSession().on("compiled", function(e){
        outputEditor.getSession().doc.setValue(e.data);
    });

    workerOnCreate(function(){//TODO use worker init event

        ["typescripts/lib.d.ts"].forEach(function(libname){
            appFileService.readFile(libname, function(content){
                var params = {
                    data: {
                    name:libname,
                    content:content.replace(/\r\n?/g,"\n")}
                };
                editor.getSession().$worker.emit("addLibrary", params );
            });
        });
    }, 100);

    $("#javascript-run").click(function(e){
        javascriptRun();
    });

    $("#select-sample").change(function(e){
        var path = "samples/" + $(this).val();
        loadFile(path);
    });

});



