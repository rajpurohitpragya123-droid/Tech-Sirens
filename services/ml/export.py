import argparse,json
from pathlib import Path
import torch
from torchvision import models
p=argparse.ArgumentParser();p.add_argument('--model',type=Path,required=True);a=p.parse_args();labels=json.loads((a.model/'labels.json').read_text())
model=models.mobilenet_v3_small();model.classifier[-1]=torch.nn.Linear(model.classifier[-1].in_features,len(labels));model.load_state_dict(torch.load(a.model/'mobilenet_v3.pt',map_location='cpu',weights_only=True));model.eval()
torch.onnx.export(model,torch.randn(1,3,224,224),a.model/'disease.onnx',input_names=['image'],output_names=['logits'],opset_version=17,dynamic_axes={'image':{0:'batch'},'logits':{0:'batch'}})
