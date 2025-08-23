document.addEventListener('DOMContentLoaded', () => {
    const flags = document.querySelectorAll('.flag');
    const pageContent = {
        'pt': {
            'main-title': 'Portal',
            'click-instruction': 'Clique em seu país para entrar no portal',
            'footer-text-1': 'Legacy of the Vikings',
            'footer-text-2': 'Shipyard of Fiber Boats & Br Tecnologia Náutica'
        },
        'en': {
            'main-title': 'Portal',
            'click-instruction': 'Click on your country to enter the portal',
            'footer-text-1': 'Legacy of the Vikings',
            'footer-text-2': 'Shipyard of Fiber Boats & Br Nautical Technology'
        },
        'es': {
            'main-title': 'Portal',
            'click-instruction': 'Haga clic en su país para entrar al portal',
            'footer-text-1': 'Legado de los Vikingos',
            'footer-text-2': 'Astilleros de Barcos de Fibra & Br Tecnología Náutica'
        }
    };

    function updateContent(lang) {
        document.querySelector('main h2').textContent = pageContent[lang]['main-title'];
        document.querySelector('main p').textContent = pageContent[lang]['click-instruction'];
        document.querySelector('footer p:nth-of-type(1)').textContent = pageContent[lang]['footer-text-1'];
        document.querySelector('footer p:nth-of-type(2)').textContent = pageContent[lang]['footer-text-2'];
        // Você precisaria adicionar mais elementos aqui para traduzir o header também.
    }

    flags.forEach(flag => {
        flag.addEventListener('click', (event) => {
            const selectedLang = event.target.dataset.lang;
            updateContent(selectedLang);

            // Salva o idioma escolhido no localStorage
            localStorage.setItem('selectedLang', selectedLang);

            // Esconde as outras bandeiras
            flags.forEach(f => {
                if (f !== event.currentTarget) {
                    f.style.display = 'none';
                } else {
                    f.style.display = '';
                }
            });

            // Remove existing Dealer button if present
            const existingDealerBtn = document.getElementById('dealer-btn');
            if (existingDealerBtn) existingDealerBtn.remove();

            // Cria botão Dealer chamativo
            const dealerBtn = document.createElement('button');
            dealerBtn.id = 'dealer-btn';
            dealerBtn.textContent = 'Dealer';
            dealerBtn.style.background = 'linear-gradient(90deg,rgb(18, 160, 226),rgb(11, 43, 112))';
            dealerBtn.style.color = '#fff';
            dealerBtn.style.fontSize = '1.3rem';
            dealerBtn.style.fontWeight = 'bold';
            dealerBtn.style.border = 'none';
            dealerBtn.style.borderRadius = '8px';
            dealerBtn.style.padding = '16px 40px';
            dealerBtn.style.margin = '24px auto 0 auto';
            dealerBtn.style.display = 'block';
            dealerBtn.style.cursor = 'pointer';
            dealerBtn.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
            
            dealerBtn.onclick = () => {
                window.location.href = 'dealer/index.html';
            };

            // Adiciona o botão abaixo do main
            const main = document.querySelector('main');
            main.parentNode.insertBefore(dealerBtn, main.nextSibling);
        });
    });

    // Evento para o favicon-32x32.png
    const favicon = document.querySelector('img[src$="favicon-32x32.png"]');
    if (favicon) {
        favicon.style.cursor = 'pointer';
        favicon.addEventListener('click', () => {
            // Redireciona para o painel administrativo
            localStorage.setItem('selectedLang', localStorage.getItem('selectedLang') || 'pt');
            window.location.href = 'administrator.html';
        });
    }

    // Define o idioma padrão ao carregar a página (por exemplo, Português)
    const savedLang = localStorage.getItem('selectedLang') || 'pt';
    updateContent(savedLang);
});
