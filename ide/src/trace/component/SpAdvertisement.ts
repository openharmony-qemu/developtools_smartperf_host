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
                        if (this.message.startsWith('图片:')) {
                            this.noticeEl!.style.display = "flex";
                            this.noticeEl!.style.justifyContent = "center";
                            this.noticeEl!.innerHTML = `<img src ="${this.message.substring(3, this.message.length)}" style="height:150px" 
                        alt = "图片加载失败"></img>`
                        } else if (this.message.startsWith('链接:')) {
                            this.noticeEl!.style.height = "auto";
                            this.noticeEl!.style.color = "#000";
                            this.noticeEl!.innerHTML = `链接：<a href = "${this.message.substring(3, this.message.length)}" target = "black">
                        ${this.message.substring(3, this.message.length)}</a>`
                        } else {
                            this.noticeEl!.style.color = "red";
                            this.noticeEl!.innerHTML = this.message;
                        }
                        this.advertisementEL!.style!.display = 'block';
                    }
                });
            } else {
                this.message = '请求错误！';
                this.noticeEl!.style.color = "red";
                this.noticeEl!.innerHTML = this.message;
                this.advertisementEL!.style!.display = 'block';
            }
        })
    }

    initHtml(): string {
        return SpAdvertisementHtml;
    }
}