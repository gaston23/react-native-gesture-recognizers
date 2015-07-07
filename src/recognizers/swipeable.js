'use strict';

import React, { Component, View, PanResponder } from 'react-native';
import isValidSwipe from '../utils/isValidSwipe';

const directions = {
  SWIPE_UP: 'SWIPE_UP',
  SWIPE_DOWN: 'SWIPE_DOWN',
  SWIPE_LEFT: 'SWIPE_LEFT',
  SWIPE_RIGHT: 'SWIPE_RIGHT'
};

const swipeable = ({
  horizontal = false,
  vertical = false,
  left = false,
  right = false,
  up = false,
  down = false,
  continuous = true,
  initialVelocityThreshold = 0.8,
  verticalThreshold = 10,
  horizontalThreshold = 10,
  setGestureState = true
} = {}) => BaseComponent => {

  const checkHorizontal = horizontal || (left || right);
  const checkVertical = vertical || (up || down);

  return class extends Component {

    constructor(props, context) {
      super(props, context);

      this.state = {
        distance: 0,
        velocity: 0
      };

      this.swipeDetected = false;
      this.velocityProp = null;
      this.distanceProp = null;
      this.swipeDirection = null;
     }

    componentWillMount() {
      this._panResponder = PanResponder.create({

        onStartShouldSetPanResponder: (evt) => {
          return evt.nativeEvent.touches.length === 1;
        },

        onMoveShouldSetPanResponder: (evt) => {
          return evt.nativeEvent.touches.length === 1;
        },

        onPanResponderMove: (evt, gestureState) => {
          const {dx, dy, vx, vy} = gestureState;
          const { onSwipeBegin, onSwipe } = this.props;

          if (!continuous && this.swipeDetected) {
            return;
          }

          let initialDetection = false;
          let validHorizontal = false;
          let validVertical = false;

          if (!this.swipeDetected) {
            initialDetection = true;

            validHorizontal = checkHorizontal && isValidSwipe(
              vx, dy, initialVelocityThreshold, verticalThreshold
            );
            validVertical = checkVertical && isValidSwipe(
              vy, dx, initialVelocityThreshold, horizontalThreshold
            );

            if (validHorizontal) {
              this.velocityProp = 'vx';
              this.distanceProp = 'dx';

              if ((horizontal || left) && dx < 0) {
                this.swipeDirection = directions.SWIPE_LEFT;
              } else if ((horizontal || right) && dx > 0) {
                this.swipeDirection = directions.SWIPE_RIGHT;
              }
            } else if (validVertical) {
              this.velocityProp = 'vy';
              this.distanceProp = 'dy';

              if ((vertical || up) && dy < 0) {
                this.swipeDirection = directions.SWIPE_UP;
              } else if ((vertical || down) && dy > 0) {
                this.swipeDirection = directions.SWIPE_DOWN;
              }
            }

            if (this.swipeDirection) {
              this.swipeDetected = true;
            }
          }

          if (this.swipeDetected) {
            const distance = gestureState[this.distanceProp];
            const velocity = gestureState[this.velocityProp];

            const swipeState = {
              direction: this.swipeDirection,
              distance,
              velocity
            };

            if (initialDetection) {
              onSwipeBegin && onSwipeBegin(swipeState);
            } else {
              onSwipe && onSwipe(swipeState);
            }

            if (setGestureState) {
              this.setState({
                swipe: swipeState
              });
            }
          }
        },

        onPanResponderTerminationRequest: () => true,
        onPanResponderTerminate: this.handleTerminationAndRelease,
        onPanResponderRelease: this.handleTerminationAndRelease
      });
    }

    handleTerminationAndRelease = () => {
      if (this.swipeDetected) {
        const { onSwipeEnd } = this.props;
        onSwipeEnd && onSwipeEnd({
          direction: this.swipeDirection
        });
      }

      this.swipeDetected = false;
      this.velocityProp = null;
      this.distanceProp = null;
      this.swipeDirection = null;
    }

    render() {
      const {
        onSwipeBegin,
        onSwipe,
        onSwipeEnd,
        swipeDecoratorStyle,
        ...props
      } = this.props;

      const style = {
        ...swipeDecoratorStyle,
        alignSelf: 'flex-start'
      };

      const state = setGestureState ? state: null;

      return (
        <View {...this._panResponder.panHandlers} style={style}>
          <BaseComponent {...props} {...state} />
        </View>
      );
    }
  };
};

swipeable.directions = directions

export default swipeable;