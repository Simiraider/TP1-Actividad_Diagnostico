document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    const navLinks = document.querySelectorAll('.nav-links a[data-target]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            if (targetId === 'top') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                const yOffset = -100;
                const y = targetSection.getBoundingClientRect().top + window.scrollY + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });
    });

    const catalogContainer = document.getElementById('catalog-container');
    const categories = ["Destinos Populares", "Aventuras", "Escapadas"];

    let favorites = JSON.parse(localStorage.getItem('routeFlix_favorites')) || [];
    let searchQuery = "";

    function renderCatalog() {
        catalogContainer.innerHTML = '';

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const searchResults = destinations.filter(d =>
                d.title.toLowerCase().includes(query) ||
                d.category.toLowerCase().includes(query)
            );

            if (searchResults.length > 0) {
                renderRow('Resultados de la búsqueda', searchResults);
            } else {
                const noResults = document.createElement('h2');
                noResults.style.color = '#fff';
                noResults.style.textAlign = 'center';
                noResults.style.marginTop = '50px';
                noResults.textContent = 'No se encontraron destinos que coincidan con tu búsqueda.';
                catalogContainer.appendChild(noResults);
            }
        } else {
            categories.forEach(category => {
                const catDestinations = destinations.filter(d => d.category === category);
                const extendedDestinations = [...catDestinations, ...catDestinations, ...catDestinations];
                renderRow(category, extendedDestinations);
            });

            if (favorites.length > 0) {
                const favDestinations = destinations.filter(d => favorites.includes(d.id));
                if (favDestinations.length > 0) {
                    renderRow('Mi Lista', favDestinations);
                }
            }
        }
    }

    const searchBtn = document.getElementById('search-btn');
    const searchLocation = document.getElementById('search-location');

    searchBtn.addEventListener('click', () => {
        searchQuery = searchLocation.value;
        renderCatalog();

        const yOffset = -100;
        const y = catalogContainer.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    });

    searchLocation.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    function renderRow(title, rowDestinations) {
        if (rowDestinations.length === 0) return;

        const rowDiv = document.createElement('div');
        rowDiv.classList.add('category-row');
        rowDiv.id = title.toLowerCase().replace(/\s+/g, '-');

        const titleH2 = document.createElement('h2');
        titleH2.classList.add('category-title');
        titleH2.textContent = title;
        rowDiv.appendChild(titleH2);

        const carouselContainer = document.createElement('div');
        carouselContainer.classList.add('carousel-container');

        const btnLeft = document.createElement('button');
        btnLeft.classList.add('scroll-btn', 'scroll-left');
        btnLeft.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';

        const btnRight = document.createElement('button');
        btnRight.classList.add('scroll-btn', 'scroll-right');
        btnRight.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';

        const carousel = document.createElement('div');
        carousel.classList.add('carousel');

        rowDestinations.forEach(dest => {
            const isFav = favorites.includes(dest.id);
            const card = document.createElement(dest.link ? 'a' : 'div');
            card.classList.add('card');
            if (dest.link) {
                card.href = dest.link;
                card.target = "_blank";
                card.style.textDecoration = "none";
                card.style.color = "inherit";
            }

            card.innerHTML = `
                <img src="${dest.image}" alt="${dest.title}" class="card-img" loading="lazy">
                <div class="fav-icon" data-id="${dest.id}" title="${isFav ? 'Quitar de Mi Lista' : 'Añadir a Mi Lista'}">
                    <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-star"></i>
                </div>
                <div class="card-info">
                    <div class="card-title">${dest.title}</div>
                    <div class="card-meta">
                        <span class="rating"><i class="fa-solid fa-star"></i> ${dest.rating}</span>
                        <span class="price">${dest.price}</span>
                    </div>
                </div>
            `;

            const favIcon = card.querySelector('.fav-icon');
            favIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const idStr = favIcon.getAttribute('data-id');
                const id = parseInt(idStr, 10);

                if (favorites.includes(id)) {
                    favorites = favorites.filter(fId => fId !== id);
                } else {
                    favorites.push(id);
                }

                localStorage.setItem('routeFlix_favorites', JSON.stringify(favorites));
                renderCatalog();
            });

            carousel.appendChild(card);
        });

        btnLeft.addEventListener('click', () => { carousel.scrollBy({ left: -800, behavior: 'smooth' }); });
        btnRight.addEventListener('click', () => { carousel.scrollBy({ left: 800, behavior: 'smooth' }); });

        carouselContainer.appendChild(btnLeft);
        carouselContainer.appendChild(carousel);
        carouselContainer.appendChild(btnRight);

        rowDiv.appendChild(carouselContainer);
        catalogContainer.appendChild(rowDiv);
    }

    renderCatalog();
});
