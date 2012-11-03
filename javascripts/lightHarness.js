// parcial copy from typescript harness.js

// Copyright (c) Microsoft. All rights reserved. Licensed under the Apache License, Version 2.0. 
define('lightHarness', ['require', 'exports', 'module', 'ace/keyboard/hash_handler'], function(require, exports, module) {

var __extends = this.__extends || function (d, b) {
    function __() {
        this.constructor = d;
    }
    __.prototype = b.prototype;
    d.prototype = new __();
};

var ScriptInfo = (function () {
    function ScriptInfo(name, content, isResident, maxScriptVersions) {
        this.name = name;
        this.content = content;
        this.isResident = isResident;
        this.maxScriptVersions = maxScriptVersions;
        this.editRanges = [];
        this.version = 1;
    }
    ScriptInfo.prototype.updateContent = function (content, isResident) {
        this.editRanges = [];
        this.content = content;
        this.isResident = isResident;
        this.version++;
    };
    ScriptInfo.prototype.editContent = function (minChar, limChar, newText) {
        var prefix = this.content.substring(0, minChar);
        var middle = newText;
        var suffix = this.content.substring(limChar);
        this.content = prefix + middle + suffix;
        this.editRanges.push({
            length: this.content.length,
            editRange: new TypeScript.ScriptEditRange(minChar, limChar, (limChar - minChar) + newText.length)
        });
        if(this.editRanges.length > this.maxScriptVersions) {
            this.editRanges.splice(0, this.maxScriptVersions - this.editRanges.length);
        }
        this.version++;
    };
    ScriptInfo.prototype.getEditRangeSinceVersion = function (version) {
        if(this.version == version) {
            return null;
        }
        var initialEditRangeIndex = this.editRanges.length - (this.version - version);
        if(initialEditRangeIndex < 0 || initialEditRangeIndex >= this.editRanges.length) {
            return TypeScript.ScriptEditRange.unknown();
        }
        var entries = this.editRanges.slice(initialEditRangeIndex);
        var minDistFromStart = entries.map(function (x) {
            return x.editRange.minChar;
        }).reduce(function (prev, current) {
            return Math.min(prev, current);
        });
        var minDistFromEnd = entries.map(function (x) {
            return x.length - x.editRange.limChar;
        }).reduce(function (prev, current) {
            return Math.min(prev, current);
        });
        var aggDelta = entries.map(function (x) {
            return x.editRange.delta;
        }).reduce(function (prev, current) {
            return prev + current;
        });
        return new TypeScript.ScriptEditRange(minDistFromStart, entries[0].length - minDistFromEnd, aggDelta);
    };
    return ScriptInfo;
})();
exports.ScriptInfo = ScriptInfo;
var TypeScriptLS = (function () {
    function TypeScriptLS() {
        this.ls = null;
        this.scripts = [];
        this.maxScriptVersions = 100;
    }
    TypeScriptLS.prototype.addDefaultLibrary = function () {
        this.addScript("lib.d.ts", Harness.Compiler.libText, true);
    };
    TypeScriptLS.prototype.addFile = function (name, isResident) {
        if (typeof isResident === "undefined") { isResident = false; }
        var code = Harness.CollateralReader.read(name);
        this.addScript(name, code, isResident);
    };
    TypeScriptLS.prototype.addScript = function (name, content, isResident) {
        if (typeof isResident === "undefined") { isResident = false; }
        var script = new ScriptInfo(name, content, isResident, this.maxScriptVersions);
        this.scripts.push(script);
    };
    TypeScriptLS.prototype.updateScript = function (name, content, isResident) {
        if (typeof isResident === "undefined") { isResident = false; }
        for(var i = 0; i < this.scripts.length; i++) {
            if(this.scripts[i].name == name) {
                this.scripts[i].updateContent(content, isResident);
                return;
            }
        }
        this.addScript(name, content, isResident);
    };
    TypeScriptLS.prototype.editScript = function (name, minChar, limChar, newText) {
        for(var i = 0; i < this.scripts.length; i++) {
            if(this.scripts[i].name == name) {
                this.scripts[i].editContent(minChar, limChar, newText);
                return;
            }
        }
        throw new Error("No script with name '" + name + "'");
    };
    TypeScriptLS.prototype.getScriptContent = function (scriptIndex) {
        return this.scripts[scriptIndex].content;
    };
    TypeScriptLS.prototype.information = function () {
        return true;
    };
    TypeScriptLS.prototype.debug = function () {
        return true;
    };
    TypeScriptLS.prototype.warning = function () {
        return true;
    };
    TypeScriptLS.prototype.error = function () {
        return true;
    };
    TypeScriptLS.prototype.fatal = function () {
        return true;
    };
    TypeScriptLS.prototype.log = function (s) {
        // console.log("TypeScriptLS:" + s);
    };
    TypeScriptLS.prototype.getCompilationSettings = function () {
        return "";
    };
    TypeScriptLS.prototype.getScriptCount = function () {
        return this.scripts.length;
    };
    TypeScriptLS.prototype.getScriptSourceText = function (scriptIndex, start, end) {
        return this.scripts[scriptIndex].content.substring(start, end);
    };
    TypeScriptLS.prototype.getScriptSourceLength = function (scriptIndex) {
        return this.scripts[scriptIndex].content.length;
    };
    TypeScriptLS.prototype.getScriptId = function (scriptIndex) {
        return this.scripts[scriptIndex].name;
    };
    TypeScriptLS.prototype.getScriptIsResident = function (scriptIndex) {
        return this.scripts[scriptIndex].isResident;
    };
    TypeScriptLS.prototype.getScriptVersion = function (scriptIndex) {
        return this.scripts[scriptIndex].version;
    };
    TypeScriptLS.prototype.getScriptEditRangeSinceVersion = function (scriptIndex, scriptVersion) {
        var range = this.scripts[scriptIndex].getEditRangeSinceVersion(scriptVersion);
        return (range.minChar + "," + range.limChar + "," + range.delta);
    };
    TypeScriptLS.prototype.getLanguageService = function () {
        var ls = new Services.TypeScriptServicesFactory().createLanguageServiceShim(this);
        ls.refresh(true);
        this.ls = ls;
        return ls;
    };
    TypeScriptLS.prototype.parseSourceText = function (fileName, sourceText) {
        var parser = new TypeScript.Parser();
        parser.setErrorRecovery(null, -1, -1);
        parser.errorCallback = function (a, b, c, d) {
        };
        var script = parser.parse(sourceText, fileName, 0);
        return script;
    };
    TypeScriptLS.prototype.parseFile = function (fileName) {
        var sourceText = new TypeScript.StringSourceText(IO.readFile(fileName));
        return this.parseSourceText(fileName, sourceText);
    };
    TypeScriptLS.prototype.lineColToPosition = function (fileName, line, col) {
        var script = this.ls.languageService.getScriptAST(fileName);
        assert.notNull(script);
        assert(line >= 1);
        assert(col >= 1);
        assert(line < script.locationInfo.lineMap.length);
        return TypeScript.getPositionFromLineColumn(script, line, col);
    };
    TypeScriptLS.prototype.positionToLineCol = function (fileName, position) {
        var script = this.ls.languageService.getScriptAST(fileName);
        assert.notNull(script);
        var result = TypeScript.getLineColumnFromPosition(script, position);
        assert(result.line >= 1);
        assert(result.col >= 1);
        return result;
    };
    TypeScriptLS.prototype.checkEdits = function (sourceFileName, baselineFileName, edits) {
        var script = Harness.CollateralReader.read(sourceFileName);
        var formattedScript = this.applyEdits(script, edits);
        var baseline = Harness.CollateralReader.read(baselineFileName);
        assert.noDiff(formattedScript, baseline);
        assert.equal(formattedScript, baseline);
    };
    TypeScriptLS.prototype.applyEdits = function (content, edits) {
        var result = content;
        edits = this.normalizeEdits(edits);
        for(var i = edits.length - 1; i >= 0; i--) {
            var edit = edits[i];
            var prefix = result.substring(0, edit.minChar);
            var middle = edit.text;
            var suffix = result.substring(edit.limChar);
            result = prefix + middle + suffix;
        }
        return result;
    };
    TypeScriptLS.prototype.normalizeEdits = function (edits) {
        var result = [];
        function mapEdits(edits) {
            var result = [];
            for(var i = 0; i < edits.length; i++) {
                result.push({
                    edit: edits[i],
                    index: i
                });
            }
            return result;
        }
        var temp = mapEdits(edits).sort(function (a, b) {
            var result = a.edit.minChar - b.edit.minChar;
            if(result == 0) {
                result = a.index - b.index;
            }
            return result;
        });
        var current = 0;
        var next = 1;
        while(current < temp.length) {
            var currentEdit = temp[current].edit;
            if(next >= temp.length) {
                result.push(currentEdit);
                current++;
                continue;
            }
            var nextEdit = temp[next].edit;
            var gap = nextEdit.minChar - currentEdit.limChar;
            if(gap >= 0) {
                result.push(currentEdit);
                current = next;
                next++;
                continue;
            }
            if(currentEdit.limChar >= nextEdit.limChar) {
                next++;
                continue;
            } else {
                throw new Error("Trying to apply overlapping edits");
            }
        }
        return result;
    };
    return TypeScriptLS;
})();
exports.TypeScriptLS = TypeScriptLS;

});