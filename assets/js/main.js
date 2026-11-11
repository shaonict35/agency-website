/**
 * Insight Creative Studio - Agency Custom Interactive Controller (Mobile & Tablet Optimized)
 */
(function ($) {
    "use strict";

    $(document).ready(function () {
        // Set dynamic copyright year
        var currentYear = new Date().getFullYear();
        $(".copyright-year").text(currentYear);

        // Mobile dropdown toggles: clicking link or button toggles sub-menu
        $(".mobile-main-navigation").on("click", "li.dropdown > a", function (e) {
            var $parentLi = $(this).parent("li.dropdown");
            var $submenu = $(this).siblings("ul.dropdown-menu");
            if ($submenu.length && ($(this).attr("href") === "#0" || $(this).attr("href") === "#" || $(this).attr("href").startsWith("#"))) {
                e.preventDefault();
                $submenu.slideToggle(300);
                $parentLi.find("> .dropdown-btn").toggleClass("active");
            }
        });

        // Auto-close mobile offcanvas when an anchor link is clicked
        $(".offcanvas_box_active").on("click", "a[href^='#']:not([href='#0']):not([href='#'])", function () {
            $(".offcanvas_box_active").removeClass("active");
            $(".wa-overly").removeClass("active");
        });

        // CTA Quote / Contact Form Interactive Handler
        $("form.wpcf7-form").on("submit", function (e) {
            e.preventDefault();
            var $form = $(this);
            var isNewsletter = $form.find(".as-footer-1-newsletter-form").length > 0;

            if (isNewsletter) {
                var emailVal = $form.find("input[type='email']").val();
                if (!emailVal || !emailVal.includes("@")) {
                    alert("Please enter a valid email address.");
                    return;
                }
                var $btn = $form.find("button[type='submit']");
                var origText = $btn.find(".text").text();
                $btn.find(".text").text("Subscribing...");
                setTimeout(function () {
                    $btn.find(".text").text("Subscribed! ✓");
                    $form.find("input[type='email']").val("");
                    setTimeout(function () {
                        $btn.find(".text").text(origText);
                    }, 3000);
                }, 600);
            } else {
                var nameVal = $form.find("input[name='text-60']").val();
                var emailVal = $form.find("input[name='email-60']").val();
                if (!nameVal || !emailVal) {
                    alert("Please fill in your name and email.");
                    return;
                }
                var $btn = $form.find("button[type='submit']");
                var origText = $btn.find(".text").text();
                $btn.find(".text").text("Sending...");
                setTimeout(function () {
                    $btn.find(".text").text("Message Sent! ✓");
                    $form[0].reset();
                    alert("Thank you, " + nameVal + "! Your message has been received. Our team will contact you soon.");
                    setTimeout(function () {
                        $btn.find(".text").text(origText);
                    }, 3000);
                }, 800);
            }
        });

        // Ensure all background images and data-backgrounds are applied
        $("[data-background]").each(function () {
            var bg = $(this).attr("data-background");
            if (bg) {
                $(this).css("background-image", "url('" + bg + "')");
            }
        });

        // Ensure preloader always fades out cleanly
        setTimeout(function () {
            var preloader = document.querySelector(".as-preloader");
            if (preloader) {
                preloader.classList.add("loaded");
                setTimeout(function () {
                    preloader.remove();
                }, 1000);
            }
        }, 1200);
    });
})(jQuery);
