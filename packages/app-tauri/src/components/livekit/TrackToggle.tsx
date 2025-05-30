import type { CaptureOptionsBySource, ToggleSource } from '@livekit/components-core'
import type { TrackPublishOptions } from 'livekit-client'
import { useTrackToggle } from '@livekit/components-react'

import * as React from 'react'
import { Button } from '../ui/button'

/** @public */
export interface TrackToggleProps<T extends ToggleSource>
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  source: T
  showIcon?: boolean
  initialState?: boolean
  /**
   * Function that is called when the enabled state of the toggle changes.
   * The second function argument `isUserInitiated` is `true` if the change was initiated by a user interaction, such as a click.
   */
  onChange?: (enabled: boolean, isUserInitiated: boolean) => void
  captureOptions?: CaptureOptionsBySource<T>
  publishOptions?: TrackPublishOptions
  onDeviceError?: (error: Error) => void
}

/**
 * With the `TrackToggle` component it is possible to mute and unmute your camera and microphone.
 * The component uses an html button element under the hood so you can treat it like a button.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <TrackToggle source={Track.Source.Microphone} />
 *   <TrackToggle source={Track.Source.Camera} />
 * </LiveKitRoom>
 * ```
 * @public
 */
export const TrackToggle: <T extends ToggleSource>(
  props: TrackToggleProps<T> & React.RefAttributes<HTMLButtonElement>,
) => React.ReactNode = /* @__PURE__ */ function TrackToggle<
  T extends ToggleSource,
>({ ref, showIcon, ...props }) {
  const { buttonProps, enabled } = useTrackToggle(props)
  return (
    <Button size="icon" ref={ref} {...buttonProps} className="rounded-full w-14 h-14">
      {props.children}
    </Button>
  )
}
