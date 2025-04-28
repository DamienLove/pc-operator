from flask import Flask, request, jsonify
import subprocess
import shlex

app = Flask(__name__)

@app.route('/enqueueCommand', methods=['POST'])
def enqueue_command():
    data = request.get_json()

    action = data.get('action')

    if action == "shell":
        payload = data.get('payload', {})
        cmd = payload.get('cmd')

        if cmd:
            # Very basic command security
            allowed_commands = ['notepad', 'calc', 'mspaint']
            base_cmd = shlex.split(cmd)[0]

            if base_cmd not in allowed_commands:
                return jsonify({"error": "Command not allowed"}), 400

            try:
                subprocess.Popen(shlex.split(cmd))
                return jsonify({"status": f"Command '{cmd}' launched successfully!"}), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500
        else:
            return jsonify({"error": "No command provided"}), 400

    else:
        return jsonify({"error": "Unsupported action"}), 400

if __name__ == '__main__':
    app.run(port=5000, debug=True)
