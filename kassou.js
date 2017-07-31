$('document').ready(function() {
    $('.kassou').kassou({
        viewable: 3, //change to additional slides shown
        centred: true,
        reactiveHeight: false,
        changingWidth: true,
    });
});
// TODO:
// Mobile Controls, Device Parity, Reactive Viewable, Finish Variable Width
(function($) {
    $.fn.kassou = function(settings) {
        const kassou = new Kassou(this, settings); //append to a list, or there will be clashes
    };

    function Kassou(element, settings) {
        const _ = this;

        _.viewable = settings.viewable;
        _.centred = settings.centred;
        _.reactToHeight = settings.reactiveHeight;
        _.varyingWidth = settings.changingWidth;

        _.frame = element;
        _.initialOffset = null;
        _.activeSlide = 0;
        _.initialOffset = 0;
        _.slider = null;
        _.slides = null;
        _.clones = null;
        _.buttons = null;
        _.slideCount = 0;
        _.frameWidth = null;
        _.slideWidth = null;
        _.slideHeight = null;

        _.defaultCSS = {
            frameCSS: {
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                zIndex: 0,
            },

            slideCSS: {
                display: 'inline-block',
            },

            sliderCSS: {
                position: 'relative',
            },

            buttonCSS: {
                position: 'absolute',
                zIndex: '1000',
                width: '20px',
                backgroundColor: 'black',
                opacity: 0.2,
                color: 'white',
            },
        };

        _.init();
    };

    Kassou.prototype.init = function() {
        const _ = this;
        _.construct();
        _.setCSS();
        _.setDimensions();
        _.constructButtons();
        _.setPosition();
        _.addListeners();
        _.setClasses();
    };

    Kassou.prototype.construct = function() {
        const _ = this;

        _.slides = _.frame.children(':not(.k-clone)');
        _.slideCount = _.slides.length;

        _.frame.addClass('k-frame');
        _.slides.each(function(i, el) {
            $(el).attr('k-index', i).addClass('k-slide');
        });

        _.slider = _.slides.wrapAll('<div class="k-slider"></div>')
            .parent();
        
        _.constructInfinite();
    };

    Kassou.prototype.constructInfinite = function() {
        const _ = this;

        for (let i = _.slideCount; i > (_.slideCount - _.viewable - 1); i -= 1) {
            $(_.slides[i-1]).clone(true)
                .prependTo(_.slider)
                .addClass('k-clone');
        };
        for (let i = 0; i < _.viewable + 1; i += 1) {
            $(_.slides[i]).clone(true)
                .appendTo(this.slider)
                .addClass('k-clone');
        };

        _.clones = $('.k-clone');
    };

    Kassou.prototype.constructButtons = function(){
        const _ = this;

        _.frame.prepend('<div class="k-button" id="k-goleft"><</div><div class="k-button" id="k-goright">></div>');
        _.buttons = _.frame.children('.k-button');
        _.buttons.css('height', _.slideHeight);
        _.buttons.filter('#k-goright').css('left', _.frameWidth);
        _.buttons.css(_.defaultCSS.buttonCSS);
    }

    Kassou.prototype.addListeners = function() {
        const _ = this;

        _.buttons.hover(function(){
            $(this).animate({opacity: '0.7'});
        },
            function(){
                $(this).animate({opacity: '0.2'})
            }
        );

        _.buttons.filter('#k-goleft').click(_.kDebounce(function(){
                _.animateSlider('left');
            }, 300));

        _.buttons.filter('#k-goright').click(_.kDebounce(function(){
                _.animateSlider('right');
            }, 300));

       // _.frame.click(_.kDebounce(function(){
       //     _.animateSlider('right');
       // }, 300));
    };

    Kassou.prototype.animateSlider = function(dir) {
        const _ = this;

        let target;
        let distance;
        
        if (dir == 'right'){
            target = (_.activeSlide >= _.slideCount - 1) ? 0 : _.activeSlide + 1;
        } else {
            target = (_.activeSlide <= 0) ? _.slideCount - 1 : _.activeSlide - 1;
        }

        let direction;
        if (dir === 'left') {
            distance = _.getDistance(_.activeSlide, target, 'left');
            direction = '+=';
            _.activeSlide = target;
        } else {
            distance = _.getDistance(_.activeSlide, target, 'right');
            direction = '-=';
            _.activeSlide = target;
        }

        if (_.reactToHeight) {
                _.reactiveHeight(_.activeSlide);
            }
        
        _.slider.animate({left: direction + distance + 'px'}, function() {
            if (target === 0 && dir === 'right') {
                _.activeSlide = 0;
                _.slider.css('left', '-' + _.initialOffset + 'px');
            } else if (_.activeSlide === (_.slideCount - 1) && dir === 'left') {
                _.activeSlide = _.slideCount - 1;
                _.slider.css('left', '-' + (_.initialOffset + _.getDistance(0,_.slideCount - 1, 'right')) + 'px');
            }
        });
        _.setClasses();
    };

    Kassou.prototype.setDimensions = function() {
        const _ = this;

        _.slideWidth = _.slides.first().outerWidth(true);
        _.slideHeight = _.slides.first().outerHeight(true);
        if (_.centred === true ) {
            _.frameWidth = _.slideWidth * (_.viewable + 1);
        } else {
            _.frameWidth = _.slideWidth * _.viewable;
        }
        _.frame.width(_.frameWidth);
        _.frame.height(_.slideHeight);
        _.slider.height(_.slideHeight);
        _.slider.width(_.frameWidth * _.slideCount);
    };

    Kassou.prototype.setPosition = function() {
        const _ = this;

        if (_.centred === true) {
            let cloneOffset = 0;
            _.slides.eq(_.activeSlide).prevAll().each(function(){
                cloneOffset += $(this).outerWidth();
            })

            _.initialOffset = (cloneOffset) - (_.frameWidth / 2) + (_.slideWidth / 2);
        } else {
            _.initialOffset = (_.viewable * _.slideWidth);
        }

        _.slider.css('left', '-' + _.initialOffset + 'px');
    };

    Kassou.prototype.setCSS = function() {
        const _ = this;

        _.frame.css(_.defaultCSS.frameCSS);
        _.slides.css(_.defaultCSS.slideCSS);
        _.clones.css(_.defaultCSS.slideCSS);
        _.slider.css(_.defaultCSS.sliderCSS);
    };

    Kassou.prototype.setClasses = function() {
        const _ = this;

        let activeIndex = _.activeSlide;
        let prepOffset = Math.ceil(_.viewable / 2)
        let prepLeft = (activeIndex - prepOffset < 0) ? _.slideCount - prepOffset + activeIndex : activeIndex - prepOffset;
        let prepRight = (activeIndex + prepOffset > _.slideCount - 1) ? activeIndex + prepOffset - _.slideCount : activeIndex + prepOffset;
        
        console.log(prepLeft, prepRight)

        _.slider.children('.k-active').removeClass('k-active');
        _.slider.children('.k-prep-left').removeClass('k-prep-left');
        _.slider.children('.k-prep-right').removeClass('k-prep-right');
        _.slider.children('.k-active-right').removeClass('k-active-right');
        _.slider.children('.k-active-left').removeClass('k-active-left');

        _.slider.children('.k-slide[k-index=' + activeIndex + ']').addClass('k-active');
        _.slider.children('.k-slide[k-index=' + prepLeft + ']').addClass('k-prep-left');
        _.slider.children('.k-slide[k-index=' + prepRight + ']').addClass('k-prep-right');

        for (let i = 1; i < prepOffset; i++) {
            let rindex = (activeIndex + i > _.slideCount - 1) ? activeIndex + i - _.slideCount : activeIndex + i ;
            let lindex = (activeIndex - i < 0) ? activeIndex - i + _.slideCount : activeIndex - 1 ;
            _.slider.children('.k-slide[k-index=' + rindex + ']').addClass('k-active-right');
            _.slider.children('.k-slide[k-index=' + lindex + ']').addClass('k-active-left');
        }
    };

    Kassou.prototype.reactiveHeight = function(index) {
        const _ = this;

        let height = _.slides.eq(index).outerHeight(true);
        _.frame.animate({height: height});
    };

    Kassou.prototype.getDistance = function(current, target, direction) {
        const _ = this;

        let distance = 0;
        let slidesPassed = [];
        let counter = current;

        //re-write maybe
        if (direction == 'right'){
        while (true) {
                slidesPassed.push(counter)
                if (counter == target) {
                    break;
                } else if (counter == _.slideCount - 1) {
                    counter = 0;
                } else {
                    counter++;
                }
            }
        } else {
            while (true) {
                slidesPassed.push(counter);
                if (counter == target) {
                    break;
                } else if (counter == 0) {
                    counter = _.slideCount - 1;
                } else {
                    counter--;
                }
            }
        }

        for (let i = 0; i < slidesPassed.length; i++) {
            let slideIndex = slidesPassed[i];
            if (slideIndex == current || slideIndex == target) {
                distance += _.slides.eq(slideIndex).outerWidth()/2;
            } else {
                distance += _.slides.eq(slideIndex).outerWidth();
            }
        }

        return distance;
    };

    Kassou.prototype.kDebounce = function(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

    return this;
})(jQuery);
