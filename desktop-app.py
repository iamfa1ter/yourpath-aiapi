import sys
from PyQt5.QtWidgets import QApplication, QMainWindow
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl

class YourPathAIApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("YourPath AI")
        self.setGeometry(100, 100, 1200, 800)

        browser = QWebEngineView()
        browser.load(QUrl("https://yourpathai.netlify.app"))

        self.setCentralWidget(browser)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = YourPathAIApp()
    window.show()
    sys.exit(app.exec_())
