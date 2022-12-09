export default `
const observerRainbowKit = observeDOM(document.body, function(m){
    if (window.ethereum && window.ethereum._selectedAddress) {
        observerRainbowKit.disconnect();
        return;
    }

    let imageDives = document.querySelectorAll("button[data-testid='rk-wallet-option-metaMask'] div[role='img'] > div");
    if (imageDives.length > 0) {
        for (let e of imageDives) {
            if (e.style.backgroundImage) {
                e.style.backgroundImage = "url('https://github.com/Wallet3/Wallet3/blob/ios/assets/icon@128.png?raw=true')"
            }
        }

        for (let e of document.querySelectorAll("button[data-testid='rk-wallet-option-metaMask'] div *")) {
            if (e.childElementCount === 0 && e.textContent.toLowerCase() === 'metamask') e.textContent = 'Wallet 3';
        }
    }
    
    let connectKitSpans= document.querySelectorAll("#__CONNECTKIT__ button span");
    if (connectKitSpans.length > 0) {
        for (let e of connectKitSpans) {
            if (e.textContent.toLowerCase() === "metamask") {
                e.textContent = "Wallet 3";
                let metamaskButton = e.parentElement;
                let mmSvg = metamaskButton.querySelector("svg");
                if (!mmSvg) return;
                
                mmSvg.style.display = 'none';
                let svgContainer = mmSvg.parentElement;
                let ckImg = document.createElement('img');
                ckImg.setAttribute("src", "https://github.com/Wallet3/Wallet3/blob/ios/assets/icon@128.png?raw=true");
                ckImg.setAttribute("width", '97.5%');
                ckImg.setAttribute("height", '97.5%');
                ckImg.style.borderRadius = '10px';
                svgContainer.appendChild(ckImg);
                break;
            }
        }
    }
});
`;
