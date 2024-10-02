from flask import Flask, request

app = Flask(__name__)

transitModes = []

'''
@app.route("/")
def index():
    return app.send_static_file("index.html")
'''

@app.route("/setmodes", methods=["POST"])
def setmodes():
    # reset modes first
    transitModes = []

    args = request.form
    
    for arg in args:
        modes = args[arg].split(" ")
        for mode in modes:
            transitModes.append(mode)
    
    return transitModes
