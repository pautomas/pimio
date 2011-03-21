var image2canvas = (function (global, document, undefined) {
    // parseUri 1.2.2
    // (c) Steven Levithan <stevenlevithan.com>
    // MIT License
    function parseUri(str) {
        var o   = parseUri.options,
            m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
            uri = {},
            i   = 14;

        while (i--) uri[o.key[i]] = m[i] || "";

        uri[o.q.name] = {};
        uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
            if ($1) uri[o.q.name][$1] = $2;
        });

        return uri;
    };

    parseUri.options = {
        strictMode: false,
        key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
        q:   {
            name:   "queryKey",
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g
        },
        parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
    };

    var hasSameOrigin = (function (global, document) {
        var local = parseUri(document.location.href),
            closure = function (remote_url) {
                var remote = parseUri(remote_url),
                    local_origin = local.protocol +'//'+ local.authority,
                    remote_origin = remote.protocol +'//'+ remote.authority,
                    is_relative = (! remote.authority) && remote.relative,
                    is_data = (remote.protocol === 'data'),
                    is_local = is_data || is_relative,
                    is_same = local_origin === remote_origin;

                return is_local || is_same;
            };

        return closure;

    })( global, document );

    function url2data(img_url, onLoad, onError) {
        var cb = function(o) {
                var results = o;
                if (results.error){ onError( results.error ); }
                if (results.data){ onLoad( results.data ); }
            },
            /*cb = function (o)
            {
                var results = o.query.results;
                if (results.error){ onError( results.error ); }
                if (results.url){ onLoad( results.url ); }
            },*/
            cb_stack_name = "url2data_callbacks",
            cb_stack = cb_stack_name in global ? global[cb_stack_name] : global[cb_stack_name] = [],
            cb_name = cb_stack_name +'['+ cb_stack.length +']',
            /*
            service_root = '//query.yahooapis.com/v1/public/yql',
            query = escape('select * from data.uri where url="') + encodeURIComponent(img_url) + escape('"'),
            service_url = service_root + "?q=" + query + "&format=json&callback=" + cb_name,
            */
            service_root = '//img-to-json.appspot.com/',
            service_url = service_root + '?url=' + encodeURIComponent(img_url) + "&callback=" + cb_name,
            
            script = document.createElement('script');

            cb_stack.push( cb );
            script.onerror = onError;
            script.src = service_url;
            document.body.appendChild(script);
    };

    function loadImage(img, onLoad, onError) {
        var onImageLoaded = function(e) { onLoad( e.target ); },
            onDataLoaded = function(obj) {
                img.addEventListener('load', onImageLoaded, false);
                img.src = obj;
            };

        if (!hasSameOrigin(img.src)) {
            url2data(img.src, onDataLoaded, onError);
        } else {
            img.complete ? onLoad(img) : img.addEventListener('load', onImageLoaded, false);
        }
    };

    function image2canvas(img, onCanvasReady, onImageLoaded, onImageError) {
        onImageLoaded = onImageLoaded || function(img) {
            var canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage( img, 0, 0 );
            onCanvasReady( canvas, img );
        };

        loadImage(img, onImageLoaded, onImageError);
    };

    return image2canvas;

})(window, document);

(function() {
    Pimio = function(selector, options) {
        console.log("Apply " + options.effect);
        var image = document.getElementById(selector);
        image.removeAttribute('loaded');
        //console.log("loading " + image.src);
        
        image2canvas(
            image, 
            function() {
                console.log("READY");
                console.log(arguments);   
            }, 
            function() { 
                console.log("LOAD 1");
                //console.log(arguments); 
                if (image.getAttribute('loaded') != 'true') {
                    var f = new FxManager(image, options);
                    image.setAttribute('loaded', 'true');
                }
            },
            function() { 
                console.log("ERROR");
                console.log(arguments); 
            }
        );
        
        //var f = new FxManager(image, options);
    };
    
    FxManager = function(image, options) {
        this.image = image;
        this.x = 0;
        this.y = 0;
        this.w = this.image.width;
        this.h = this.image.height;
        console.log(this);
        this.canvas = document.createElement("canvas");
        //if (typeof FlashCanvas != "undefined") {
        //    FlashCanvas.initElement(this.canvas);
        //}

        this.canvas.width = this.w;
        this.canvas.height = this.h;
                
        this.ctx = this.canvas.getContext("2d");

        this.ctx.drawImage(this.image, 0, 0);

        this.applyFx(options.effect);
                
        var transformStyle = [];
        if (options.rotate) {
            var r =  options.rotate == "random" ? Math.floor(Math.random() * (-5-5+1)) + 5 : parseInt(options.rotate);
            transformStyle.push("rotate("+r+"deg)");
        }
        if (options.scale) {
            transformStyle.push("scale("+options.scale+")");
        }

        /*
        this.canvas.setAttribute('style', this.image.getAttribute('style'));
        this.canvas.setAttribute('class', this.image.getAttribute('class'));

        this.canvas.style.WebkitTransform = transformStyle.join(" ");
        this.canvas.style.MozTransform = transformStyle.join(" ");
        this.canvas.style.transform = transformStyle.join(" ");

        this.image.parentNode.insertBefore(this.canvas, this.image.nextSibling);
        this.image.style.display = "none";
        */
                
        this.image.setAttribute('osrc', this.image.src);
        this.image.src = this.canvas.toDataURL();

        this.image.setAttribute('style', this.image.getAttribute('style'));
        this.image.setAttribute('class', this.image.getAttribute('class'));

        this.image.style.WebkitTransform = transformStyle.join(" ");
        this.image.style.MozTransform = transformStyle.join(" ");
        this.image.style.OTransform = transformStyle.join(" ");
        this.image.style.transform = transformStyle.join(" ");

    };

    FxManager.prototype.Coord = function (x,y) {
        if(!x) { var x=0; }
        if(!y) { var y=0; }
        return { x: x, y: y };
    };
            
    FxManager.prototype.applyFx = function(effect) {
        var fx = this.effects[effect];
     
        if (fx.pre) {
            fx.pre.call(this);
        }

        if (fx.colorCurve) {
            var RED = [];
            var GREEN = [];
            var BLUE = [];
    
            var Re1 = new this.Coord(64,64+fx.colorCurve.red[0]);
            var Re2 = new this.Coord(191,191+fx.colorCurve.red[1]);
    
            var Gr1 = new this.Coord(64,64+fx.colorCurve.green[0]);
            var Gr2 = new this.Coord(191,191+fx.colorCurve.green[1]);
    
            var Bl1 = new this.Coord(64,64+fx.colorCurve.blue[0]);
            var Bl2 = new this.Coord(191,191+fx.colorCurve.blue[1]);
            
            var C0 = new this.Coord(0,0);
            var C3 = new this.Coord(255,255);
            
            var sanitize = function(v) {
                if (v>255) return 255;
                if (v<0) return 0;
                return v;
            }
            
            if (!fx.colorCurveCache) {
                for (var i = 0; i <= 255; i++) {
                    RED[i] = sanitize(255-this.bezier(i/255, C0, Re1, Re2, C3).y);
                    GREEN[i] = sanitize(255-this.bezier(i/255, C0, Gr1, Gr2, C3).y);
                    BLUE[i] = sanitize(255-this.bezier(i/255, C0, Bl1, Bl2, C3).y);
                }
                fx.colorCurveCache = {
                    r : RED,
                    g : GREEN,
                    b : BLUE  
                }
            }else{
                RED = fx.colorCurveCache.r;    
                GREEN = fx.colorCurveCache.g;    
                BLUE = fx.colorCurveCache.b;    
            }
            
            this.imgd = this.ctx.getImageData(this.x, this.y, this.w, this.h);
            var pix = this.imgd.data;

            for (var i = 0, n = pix.length; i < n; i += 4) {
              
                var r = sanitize(pix[i]);
                var g = sanitize(pix[i+1]);
                var b = sanitize(pix[i+2]);
                var a = sanitize(pix[i+3]);
    			var l = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
                
                if (fx.desaturate) {
                    pix[i] = RED[Math.floor(l)];
                    pix[i+1] = GREEN[Math.floor(l)];
                    pix[i+2] = BLUE[Math.floor(l)];                    
                }else{
                    pix[i] = RED[r];
                    pix[i+1] = GREEN[g];
                    pix[i+2] = BLUE[b];
                }
                if (fx.grain) {
                    var r = 25-Math.random()*30;
                    pix[i] += r;
                    pix[i+1] += r;
                    pix[i+2] += r;
                }
                if (fx.invert) {
                    pix[i] = 255-pix[i];
                    pix[i+1] = 255-pix[i+1];
                    pix[i+2] = 255-pix[i+2];                
                }
            }
            
            this.ctx.putImageData(this.imgd, this.x, this.y);

        }

        if (fx.post) {
            fx.post.call(this);
        }
    };
    
    FxManager.prototype.bezier = function(percent, C0, C1, C2, C3) {
        function B1(t) { return t*t*t; }
        function B2(t) { return 3*t*t*(1-t); }
        function B3(t) { return 3*t*(1-t)*(1-t); }
        function B4(t) { return (1-t)*(1-t)*(1-t); }
        
        var pos = new this.Coord();
        pos.x = C0.x*B1(percent) + C1.x*B2(percent) + C2.x*B3(percent) + C3.x*B4(percent);
        pos.y = C0.y*B1(percent) + C1.y*B2(percent) + C2.y*B3(percent) + C3.y*B4(percent);
        
        return pos;
    };

    FxManager.prototype.effects = {
        crossprocess : {
            colorCurve : {
                red : [-85, 45],
                green : [-157, -22],
                blue : [58, -116]
            },
            post : function() {
                this.ctx.fillStyle = "rgba(255,255,0,0.1)";  
                this.ctx.fillRect (0, 0, this.w, this.h);
            }
        },
        lomo : {
            colorCurve : {
            red : [4, -13],
            green : [-215, 170],
            blue : [94, -58]
            },
            pre : function() {},
            post : function() {
                this.ctx.fillStyle = "rgba(255,255,0,0.1)";  
                this.ctx.fillRect (0, 0, this.w, this.h);
                // Apply vignette
                var grad = this.ctx.createRadialGradient(this.w/2, this.h/2, this.w-(this.w/1.8), this.w/2, this.h/2, this.w);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(0.6, 'rgba(0,0,0,1)');
                this.ctx.fillStyle = grad;      
                this.ctx.fillRect(0,0,this.w,this.h);
            }
        },
        greyscale : {
            desaturate: true,
            colorCurve : {
                red : [0, 0],
                green : [0, 0],
                blue : [0, 0]
            }
        },
        antique : {
            desaturate: true,
            grain: true,
            colorCurve : {
                red : [0, 0],
                green : [0, 0],
                blue : [0, 0]
            },
            post : function() {
                this.ctx.fillStyle = "rgba(255,200,0,0.1)";  
                this.ctx.fillRect (0, 0, this.w, this.h);
                // Apply vignette
                var grad = this.ctx.createRadialGradient(this.w/2, this.h/2, this.w-(this.w/1.8), this.w/2, this.h/2, this.w);
                grad.addColorStop(0, 'rgba(240,200,0,0.3)');
                grad.addColorStop(0.7, 'rgba(255,0,0,0.5)');
                this.ctx.fillStyle = grad;      
                this.ctx.fillRect(0,0,this.w,this.h);
            }
        },
        sepia : {
            desaturate: true,
            colorCurve : {
                red : [-45, -94],
                green : [-31, -45],
                blue : [58, 89]
            }
        },
        underwater : {
        desaturate: true,
            colorCurve : {
                red : [255, 255],
                green : [-255, 255], 
                blue : [-255, -255]   
            }
        },
        sunburn : {
            desaturate: true,
            colorCurve : {
                red : [-255, -255],
                green : [-255, 255], 
                blue : [255, 255]   
            },
            post : function() {
                var grad = this.ctx.createLinearGradient(0, 0, this.w+40, this.h);
                grad.addColorStop(0, 'rgba(255,0,0,0.5)');
                grad.addColorStop(0.9, 'rgba(255,255,255,0)');
                this.ctx.fillStyle = grad;      
                this.ctx.fillRect(0,0,this.w,this.h);
            }   
        },
        nightvision : {
            desaturate: true,
            grain: true,
            colorCurve : {
                red : [255, 127],
                green : [-255, 121], 
                blue : [255, 121]   
            },  
            post : function() {
                var grad = this.ctx.createRadialGradient(this.w/2, this.h/2, this.w-(this.w/2), this.w/2, this.h/2, this.w);
                grad.addColorStop(0, 'rgba(0,255,0,0.2)');
                grad.addColorStop(0.5, 'rgba(0,0,0,0.7)');
                this.ctx.fillStyle = grad;      
                this.ctx.fillRect(0,0,this.w,this.h);
            }
        },
        "70s" : {
            colorCurve : {
                red : [-125, -98], 
                green : [-125, -107], 
                blue : [-18, -4]   
            }, 
            post : function() {
                var grad = this.ctx.createLinearGradient(0, 0, this.w+30, this.h);
                grad.addColorStop(0, 'rgba(0,255,0,0.2)');
                grad.addColorStop(0.9, 'rgba(255,0,0,0.5)');
                this.ctx.fillStyle = grad;      
                this.ctx.fillRect(0,0,this.w,this.h);
            }   
        },
        emo : {
            colorCurve : {
                red : [85, 148], 
                green : [85, 143],
                blue : [81, 22]   
            }
        },
        caruso : {
            colorCurve : {
                red : [-255, -157],
                green : [-116, -81],
                blue : [-54, 0]
            }, 
            post : function() {
                var grad = this.ctx.createLinearGradient(0, 0, 0, this.h);
                grad.addColorStop(0, 'rgba(220,30,30,0.7)');
                grad.addColorStop(0.2, 'rgba(255,140,0,0.3)');
                grad.addColorStop(0.8, 'rgba(0,0,0,0)');
                grad.addColorStop(1, 'rgba(0,0,255,0.4)');
                this.ctx.fillStyle = grad;      
                this.ctx.fillRect(0,0,this.w,this.h);
            }
        }
    };
            
    window.Pimio = Pimio;
}());