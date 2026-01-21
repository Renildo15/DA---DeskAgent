from dotenv import load_dotenv
import os


load_dotenv()
TOKEN = os.getenv("AGENT_TOKEN")
URL = os.getenv("PUBLIC_WS_URL")

ALLOWED = {
  "shutdown": "sudo /sbin/shutdown now",
  "reboot": "sudo /sbin/reboot",
  "suspend": "sudo /bin/systemctl suspend",
  "cancel": "sudo /bin/shutdown -t",
  "ping": "makefoot",
  "pkill_discord": "sudo /usr/bin/pkill Discord",
  "pkill_chrome": "sudo /usr/bin/pkill Brave",
  "pkill_code": "sudo /usr/bin/pkill code",
}