FROM python:3.6
WORKDIR /app

# copy the dependencies file to the working directory
COPY requirements.txt .

RUN pip install -r requirements.txt

COPY src/ .

CMD ["python", "./server.py"]