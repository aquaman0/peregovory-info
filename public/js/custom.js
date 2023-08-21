(function ($) {

  "use strict";

    $('.materials-slider').owlCarousel({
      animateOut: 'fadeOut',
      loop: true,
      autoplayHoverPause: false,
      autoplay: false,
      smartSpeed: 1000,
      dots: true,
      nav: false,
      responsiveClass: true,
      responsive: {
        0: {
          items: 1,
        },
        1000: {
          items: 1,
        }
      }
    });

    $('.owl-carousel').owlCarousel({
      items: 1,
      merge: true,
      loop: true,
      margin: 10,
      video: true,
      lazyLoad: true,
      center: true,
      responsive:{
        480: {
          items: 2,
        },
        600: {
          items:4
        }
      }
    });

})(jQuery);
