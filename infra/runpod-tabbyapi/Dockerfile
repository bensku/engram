FROM alpine as builder

RUN wget https://github.com/git-lfs/git-lfs/releases/download/v3.4.0/git-lfs-linux-amd64-v3.4.0.tar.gz -O git-lfs.tar.gz
RUN tar xkf git-lfs.tar.gz

FROM runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04

# Install Git LFS for huggingface pulls
COPY --from=builder /git-lfs-3.4.0 /opt/git-lfs
RUN /opt/git-lfs/install.sh
RUN git lfs install

# Install tabbyAPI
WORKDIR /opt
RUN git clone https://github.com/theroyallab/tabbyAPI && cd tabbyAPI && git reset --hard 7380a3b79a3f33ccef4a8c6dae30854a23b55148 && rm -rf .git
WORKDIR /opt/tabbyAPI

RUN pip install -r requirements-cu118.txt && pip install fschat[model_worker]
RUN pip install huggingface_hub[cli] hf_transfer

COPY entrypoint.sh /opt/entrypoint.sh
ENTRYPOINT [ "/bin/bash", "/opt/entrypoint.sh" ]