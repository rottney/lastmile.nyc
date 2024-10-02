from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

transitModes = []


@app.route("/getmodes")
def getmodes():
    global transitModes
    return transitModes

@app.route("/setmodes", methods=["POST"])
def setmodes():
    global transitModes

    # reset modes first
    transitModes = []

    args = request.form
    
    for arg in args:
        modes = args[arg].split(" ")
        for mode in modes:
            transitModes.append(mode)
    
    return transitModes


def main():
    app.run()

if __name__ == "__main__":
    main()
