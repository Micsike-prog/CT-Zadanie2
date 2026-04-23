FROM public.ecr.aws/lambda/python:3.11

COPY lambda/requirements.txt ${LAMBDA_TASK_ROOT}/requirements.txt
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

COPY lambda/app.py ${LAMBDA_TASK_ROOT}/app.py
COPY ml/runs/detect/baseline/weights/best.onnx ${LAMBDA_TASK_ROOT}/model/best.onnx

CMD ["app.handler"]
