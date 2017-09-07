import * as React from 'react';

export class SortableItem extends React.Component {
  public render(): JSX.Element {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}

interface ItemWrapperProps {
  isDragging: boolean;
  onDragEnd: () => void;
  onDragAbove: () => void;
  onDragBelow: () => void;
  onDragStart: () => void;
}

const throttleDragOverMs = 100;

// Rendering each child inside a wrapper means that we can add our own props to
// allow child <> parent communication without doing any weird stuff to mutate
// existing props
class SortableItemWrapper extends React.Component<ItemWrapperProps> {
  // A quick & dirty throttle counter
  private lastCalledDragOver: number;

  constructor() {
    super();
    this.lastCalledDragOver = Date.now();
  }

  public render(): JSX.Element {
    const style: React.CSSProperties = {};

    if (this.props.isDragging) {
      style.opacity = 0;
    }

    return (
      <li
        onDragStart={this.onDragStart}
        onDragEnd={this.props.onDragEnd}
        draggable
        style={style}
        onDragOver={this.onDragOver}
      >
        {this.props.children}
      </li>
    );
  }

  private onDragStart = (): void => {
    // Waiting until the next tick means that any stylistic changes don't affect
    // the "cloned" element that's being dragged around by the cursor.
    setImmediate(this.props.onDragStart);
  }

  private onDragOver = (event: React.MouseEvent<HTMLLIElement>): void => {
    if (this.lastCalledDragOver > Date.now() - throttleDragOverMs) {
      return;
    }

    this.lastCalledDragOver = Date.now();

    const el = event.target as Element;
    const { top, bottom } = el.getBoundingClientRect();

    const halfwayY = (bottom + top) / 2;

    if (event.clientY >= halfwayY) {
      this.props.onDragBelow();
    } else {
      this.props.onDragAbove();
    }
  }
}

// Unfortunately can't enforce children at the type level
// https://github.com/Microsoft/TypeScript/issues/13618
interface ListProps {
  children: JSX.Element[];
  onItemMove: (oldIndex: number, newIndex: number) => void;
}

interface ListState {
  draggingPropIndex: number | null;

  // e.g. If a set of children ['First', 'Second', 'Third'] was dragged to the
  // order ['Second', 'First', 'Third'], this would be [2, 1, 3]
  childrenOrder: number[];
}

export class SortableList extends React.Component<ListProps, ListState> {
  constructor() {
    super();

    this.state = {
      childrenOrder: [],
      draggingPropIndex: null
    };
  }

  public componentWillMount(): void {
    this.setUpState(this.props);
  }

  public render(): JSX.Element {
    const children = this.getOrderedChildren();

    return (
      <ul>
        {children.map(this.renderChild)}
      </ul>
    );
  }

  public componentWillReceiveProps(newProps: ListProps): void {
    this.setUpState(newProps);
  }

  private getOrderedChildren = (): JSX.Element[] => {
    return this.state.childrenOrder.map((index: number): JSX.Element =>
      this.props.children[index]
    );
  }

  private renderChild = (
    child: JSX.Element,
    stateIndex: number
  ): JSX.Element => {
    const propIndex = this.state.childrenOrder[stateIndex];
    const onDragAbove = (): void => this.onDragNear(propIndex, 0);
    const onDragBelow = (): void => this.onDragNear(propIndex, 1);
    const onDragStart = (): void => this.onDragStart(propIndex);
    const onDragEnd = (): void => this.onDragEnd();

    const isDragging = this.state.draggingPropIndex === propIndex;

    return (
      <SortableItemWrapper
        isDragging={isDragging}
        key={propIndex}
        onDragEnd={onDragEnd}
        onDragAbove={onDragAbove}
        onDragBelow={onDragBelow}
        onDragStart={onDragStart}
      >
        {child}
      </SortableItemWrapper>
    );
  }

  private onDragNear = (
    propIndex: number,
    offset: 0 | 1 // Zero for 'dragged above', 1 for 'dragged below'
  ): void => {
    const { draggingPropIndex, childrenOrder } = this.state;

    if (draggingPropIndex === null || propIndex === draggingPropIndex) {
      // Naively using this to detect whether it's one of our own elements being
      // dragged over. This could potentially swallow issues if `dragOver` was
      // legitimately fired without a `dragStart`, but haven't seen that.
      return;
    }

    const positionsWithoutTarget = childrenOrder.filter(
      (index: number) => index !== draggingPropIndex
    );

    const newPosition = positionsWithoutTarget.indexOf(propIndex);

    let newOrder: number[] = [];

    newOrder = newOrder
      .concat(positionsWithoutTarget.slice(0, newPosition + offset))
      .concat(draggingPropIndex)
      .concat(positionsWithoutTarget.slice(newPosition + offset));

    this.setState({
      childrenOrder: newOrder
    });
  }

  private onDragStart = (propIndex: number): void => {
    this.setState({ draggingPropIndex: propIndex });
  }

  private onDragEnd = (): void => {
    const { draggingPropIndex, childrenOrder } = this.state;

    if (draggingPropIndex === null) { return; }

    const newPosition = childrenOrder.indexOf(draggingPropIndex);

    // Reset the state to avoid confusion - it's the parent component's
    // responsibility now
    this.setUpState(this.props);

    this.props.onItemMove(
      draggingPropIndex,
      newPosition
    );
  }

  private setUpState(props: ListProps): void {
    const order: number[] = [];

    props.children.forEach((
      child: JSX.Element,
      index: number
    ) => {
      if (child.type !== SortableItem) {
        throw new Error('All SortableList children must be SortableItems');
      }

      order.push(index);
    });

    this.setState({
      childrenOrder: order,
      draggingPropIndex: null
    });
  }
}
