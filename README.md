# typescript-sortable-list

A lightweight reorderable (via HTML5 drag+drop) list in TypeScript with no dependencies.

## Usage / Example

```tsx
import { SortableItem, SortableList } from 'sortable-list';

class MyComponent extends React.Component {
  public render(): JSX.Element {
    return (
      <SortableList>
        {this.state.items.map(this.renderItem)}
      </SortableList>
    );
  }

  private renderItem = (item: Item): JSX.Element => {
    return (
      <SortableItem>{item.title}</SortableItem>
    );
  }

  private onFeatureMove = (oldIndex: number, newIndex: number): void => {
    // Update your state to put `items` in the new correct order.
    // The SortableList is a "controlled" component that resets its own state
    // after the drag operation is  complete, so it's up to the parent component
    // to persist any changes.
  }
}
```

## Roadmap

- Touch support
