"""Reference transfer-learning pipeline. Requires reviewed ImageFolder train/val data.
Usage: python train.py --data ./dataset --output ./models
Labels must be crop-qualified (e.g. tomato__early_blight). No dataset is bundled.
"""
import argparse
import json
from pathlib import Path
import torch
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--data',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--epochs',type=int,default=10);args=parser.parse_args()
    torch.manual_seed(42)
    augmentation=transforms.Compose([transforms.RandomResizedCrop(224),transforms.RandomHorizontalFlip(),transforms.RandomRotation(25),transforms.ColorJitter(.4,.4,.3,.1),transforms.RandomApply([transforms.GaussianBlur(5)],p=.2),transforms.ToTensor(),transforms.Normalize([.485,.456,.406],[.229,.224,.225])])
    train=datasets.ImageFolder(args.data/'train',augmentation)
    model=models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
    for parameter in model.features.parameters():parameter.requires_grad=False
    model.classifier[-1]=nn.Linear(model.classifier[-1].in_features,len(train.classes))
    optimizer=torch.optim.AdamW(model.classifier.parameters(),lr=.001)
    loader=DataLoader(train,batch_size=32,shuffle=True,num_workers=0)
    model.train()
    for epoch in range(args.epochs):
        total=0
        for images,labels in loader:
            optimizer.zero_grad();loss=nn.functional.cross_entropy(model(images),labels);loss.backward();optimizer.step();total+=float(loss.detach())
        print({'epoch':epoch+1,'mean_training_loss':total/max(len(loader),1)})
    args.output.mkdir(parents=True,exist_ok=True)
    torch.save(model.state_dict(),args.output/'mobilenet_v3.pt')
    (args.output/'labels.json').write_text(json.dumps(train.classes),encoding='utf-8')
    print('Training finished. Run evaluate.py against held-out field images before deployment.')
if __name__=='__main__':main()
