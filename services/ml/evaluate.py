import argparse,json
from pathlib import Path
import torch
from torchvision import datasets,models,transforms
from sklearn.metrics import classification_report,confusion_matrix
def main():
    p=argparse.ArgumentParser();p.add_argument('--data',type=Path,required=True);p.add_argument('--model',type=Path,required=True);a=p.parse_args()
    labels=json.loads((a.model/'labels.json').read_text());weights=models.MobileNet_V3_Small_Weights.DEFAULT
    data=datasets.ImageFolder(a.data,weights.transforms())
    if data.classes!=labels:raise ValueError('Evaluation class mapping differs from training')
    model=models.mobilenet_v3_small();model.classifier[-1]=torch.nn.Linear(model.classifier[-1].in_features,len(labels));model.load_state_dict(torch.load(a.model/'mobilenet_v3.pt',map_location='cpu',weights_only=True));model.eval();truth=[];predicted=[]
    with torch.inference_mode():
        for image,label in data:truth.append(label);predicted.append(int(model(image.unsqueeze(0)).argmax(1)))
    result={'report':classification_report(truth,predicted,labels=list(range(len(labels))),target_names=labels,output_dict=True,zero_division=0),'confusion_matrix':confusion_matrix(truth,predicted,labels=list(range(len(labels)))).tolist()}
    (a.model/'evaluation.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
if __name__=='__main__':main()
