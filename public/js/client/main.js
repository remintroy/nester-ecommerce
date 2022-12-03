window.addEventListener('scroll', (e) => {
    const nav = document.querySelector('.custom-navbar');
    if (window.pageYOffset > 0) {
        nav.classList.add("shadow");
    } else {
        nav.classList.remove("shadow");
    }
});