import { BaseElement, element } from '../../base-ui/BaseElement';
import { SpAdvertisementHtml } from './SpAdvertisement.html';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';

@element('sp-advertisement')
export class SpAdvertisement extends BaseElement {
    private advertisementEL: HTMLElement | undefined | null;
    private closeEL: HTMLElement | undefined | null;
    private noticeEl: HTMLElement | undefined | null;
    private message: string = '';

    initElements(): void {
        // 整个广告
        this.advertisementEL = document.querySelector('body > sp-application')?.shadowRoot?.
            querySelector('#sp-advertisement')?.shadowRoot?.querySelector('#sp-advertisement');
        // 关闭按钮
        this.closeEL = document.querySelector('body > sp-application')?.shadowRoot?.
            querySelector('#sp-advertisement')?.shadowRoot?.querySelector('#close');
        // 公告内容
        this.noticeEl = document.querySelector('body > sp-application')?.shadowRoot?.
            querySelector('#sp-advertisement')?.shadowRoot?.querySelector('.text');
        this.getMessage();
        setInterval(() => {
            this.getMessage();
        }, 10000);
        this.closeEL?.addEventListener('click', () => {
            this.advertisementEL!.style!.display = 'none';
        })
    }

    private getMessage(): void {
        SpStatisticsHttpUtil.getNotice().then(res => {
            if (res.status === 200) {
                res.text().then((it) => {
                    let resp = JSON.parse(it);
                    if (resp && resp.data && resp.data.data && resp.data.data !== this.message && resp.data.data !== '') {
                        this.message = resp.data.data;
                        let parts = this.message.split(';');
                        let linkInfo = parts[2].match(/链接:([^\s]+)/)![1] || '';
                        let link = `<a href="${linkInfo}" target="_self">${parts[1]}</a>`;
                        let finalString = `${parts[0]}<br>${link}`;
                        this.noticeEl!.innerHTML = `<p>${finalString}</p>`;
                        this.advertisementEL!.style!.display = 'block';
                    }
                });
            } else {
                this.advertisementEL!.style!.display = 'none';
            }
        }).catch(err => {
            this.advertisementEL!.style!.display = 'none';
        })
    }

    initHtml(): string {
        return SpAdvertisementHtml;
    }
}