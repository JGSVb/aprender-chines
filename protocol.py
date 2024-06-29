import traceback
import json

ANSWER_FORMAT = {
        "status": None,
        "message": None,
        "data": None
        }

class Status:
    success = "success"
    error = "error"

def build_answer(status, message, data):
    answer = ANSWER_FORMAT.copy()
    answer["status"] = status
    answer["message"] = message
    answer["data"] = data

    return answer

def successful_answer(data={}):
    return json.dumps(build_answer(Status.success, None, data))

def unsuccessful_answer(message):
    return json.dumps(build_answer(Status.error, message, None))

def response_func(f):
    def inner(*args, **kwargs):
        data = None

        try:
            data = f(*args, **kwargs)
        except Exception as e:
            # traceback.print_exc(e)
            return unsuccessful_answer(str(e))
        else:
            return successful_answer(data)

    inner.__name__ = f.__name__
    return inner

