import QRCode from './qrcode';

import { WalletTemplate } from './wallet.template.js';

export default class Wallet {
    constructor() {
        this.id = "bearguy@saito";
        this.balance = "1000.00000000";
        this.address = "dDgP4TpJ3GCCKkHn3MxEwPHx1hGNzaVFUrUDbczw7Tmd";
        this.qrcode = {};

        return this;
    }

    render() {
        let wallet = WalletTemplate(this);
        let main = document.querySelector('.main');
        main.innerHTML = wallet;

        this.qrcode = this.generateQRCode(this.address);
    }

    generateQRCode(data) {
        return new QRCode(
            document.getElementById("qrcode"),
            data
        );
    }
}
