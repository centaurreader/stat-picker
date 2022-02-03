# stat-picker

```
let values = [];
stats({
  selector: '#stats',
  labels: ['Label 1', 'Label 2', 'Label 3', 'Label 4', 'Label 5'],
  pointCount: 3,
  backgroundColor: '#000000',
  foregroundColor: '#ffffff',
  values,
  onChange: (value) => { values = value; },
});
```
