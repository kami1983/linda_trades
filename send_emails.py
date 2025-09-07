import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import re

# 发送邮件函数（兼容原有接口，新增 HTML、抄送/密送、多个收件人、附件等能力）
def send_email(
    subject,
    body,
    recipient=None,
    html=False,
    recipients=None,
    cc=None,
    bcc=None,
    attachments=None,
    sender_name=None,
):
    """
    发送邮件

    :param subject: 邮件主题
    :param body: 邮件正文
    :param recipient: 收件人（可选，默认从环境变量获取）
    """
    try:
        # 获取环境变量
        mail_send_host = os.getenv("MAIL_SEND_HOST", "NotSet")
        mail_host = os.getenv("MAIL_HOST", "smtp.ym.163.com")
        mail_port = int(os.getenv("MAIL_SMTP_PORT", 994))
        mail_user = os.getenv("MAIL_AUTH_USER", "")
        mail_pass = os.getenv("MAIL_AUTH_PASS", "")
        # 处理收件人：优先使用 recipients；兼容旧的 recipient 字段与环境变量 MAIL_TO（可用逗号分隔）
        env_mail_to = os.getenv("MAIL_TO", "")
        to_candidates = []
        if recipients:
            to_candidates = recipients if isinstance(recipients, list) else [recipients]
        elif recipient:
            to_candidates = [recipient]
        elif env_mail_to:
            to_candidates = [addr.strip() for addr in env_mail_to.split(",") if addr.strip()]

        cc_list = cc if isinstance(cc, list) else ([cc] if cc else [])
        bcc_list = bcc if isinstance(bcc, list) else ([bcc] if bcc else [])

        mail_to = ", ".join(to_candidates)

        if not mail_user or not mail_pass:
            raise ValueError("邮箱用户名或密码未配置，请检查环境变量")

        if not mail_to:
            raise ValueError("收件人邮箱未配置，请检查环境变量")

        # 设置邮件内容
        msg = MIMEMultipart("mixed")
        # 优先显示 sender_name<mail_user>；否则回退到环境变量中配置的显示名或账号本身
        from_display = f"{sender_name} <{mail_user}>" if sender_name else (mail_send_host if mail_send_host and mail_send_host != "NotSet" else mail_user)
        msg["From"] = from_display
        if to_candidates:
            msg["To"] = ", ".join(to_candidates)
        if cc_list:
            msg["Cc"] = ", ".join(cc_list)
        msg["Subject"] = subject

        # alternative 部分同时包含纯文本与 HTML（若 html=True）
        alternative_part = MIMEMultipart("alternative")
        if html:
            # 生成一个朴素文本作为回退
            plain_fallback = re.sub(r"<[^>]+>", "", body)
            alternative_part.attach(MIMEText(plain_fallback, "plain", "utf-8"))
            alternative_part.attach(MIMEText(body, "html", "utf-8"))
        else:
            alternative_part.attach(MIMEText(body, "plain", "utf-8"))
        msg.attach(alternative_part)

        # 附件处理
        if attachments:
            for path in (attachments if isinstance(attachments, list) else [attachments]):
                if not path:
                    continue
                try:
                    with open(path, "rb") as f:
                        part = MIMEBase("application", "octet-stream")
                        part.set_payload(f.read())
                    encoders.encode_base64(part)
                    filename = os.path.basename(path)
                    part.add_header("Content-Disposition", f"attachment; filename=\"{filename}\"")
                    msg.attach(part)
                except Exception as attach_err:
                    print(f"⚠️ 附件添加失败: {path} -> {attach_err}")

        # 连接 SMTP 服务器
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(mail_host, mail_port, context=context) as server:
            server.login(mail_user, mail_pass)
            # 实际发送列表包含 To/Cc/Bcc
            smtp_recipients = []
            smtp_recipients.extend(to_candidates)
            smtp_recipients.extend(cc_list)
            smtp_recipients.extend(bcc_list)
            server.sendmail(mail_user, smtp_recipients or [mail_to], msg.as_string())

        print(f"📧 邮件已成功发送至 {mail_to}")

    except Exception as e:
        print(f"❌ 发送邮件失败: {e}")

