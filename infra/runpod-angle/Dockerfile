FROM runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04

WORKDIR /
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY server.py .
CMD python server.py