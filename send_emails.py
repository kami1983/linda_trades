import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# 发送邮件函数
def send_email(subject, body, recipient=None):
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
        mail_to = recipient if recipient else os.getenv("MAIL_TO", "")

        if not mail_user or not mail_pass:
            raise ValueError("邮箱用户名或密码未配置，请检查环境变量")

        if not mail_to:
            raise ValueError("收件人邮箱未配置，请检查环境变量")

        # 设置邮件内容
        msg = MIMEMultipart()
        msg["From"] = mail_send_host
        msg["To"] = mail_to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        # 连接 SMTP 服务器
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(mail_host, mail_port, context=context) as server:
            server.login(mail_user, mail_pass)
            server.sendmail(mail_user, mail_to, msg.as_string())

        print(f"📧 邮件已成功发送至 {mail_to}")

    except Exception as e:
        print(f"❌ 发送邮件失败: {e}")

