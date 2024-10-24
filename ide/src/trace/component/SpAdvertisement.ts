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
            querySelector('#sp-advertisement')?.shadowRoot?.querySelector('#notice');
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
                        const regexImg = /图片:(.*?);/g;
                        const regexLink = /链接:(.*?);/g;
                        let matchImg;
                        let matchLink;
                        let resultStr = this.message;
                        while ((matchImg = regexImg.exec(this.message)) !== null) {
                            const imgTag = `<img src='${matchImg[1]}'/>`;
                            resultStr = resultStr.replace(matchImg[1], imgTag);
                        }
                        while ((matchLink = regexLink.exec(this.message)) !== null) {
                            const LinkTag = `<a href='${matchLink[1]}' target = 'black'>${matchLink[1]}</a>`;
                            resultStr = resultStr.replace(matchLink[1], LinkTag);
                        }
                        resultStr = resultStr.replace(/;/g, '<br>');
                        resultStr = resultStr.replace(/链接:/g, '<span>链接:</span>');
                        this.noticeEl!.innerHTML = `<p>${resultStr}</p>`;
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