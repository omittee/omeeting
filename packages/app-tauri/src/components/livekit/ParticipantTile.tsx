import type { ParticipantClickEvent, TrackReferenceOrPlaceholder } from '@livekit/components-core'
import type { Participant } from 'livekit-client'
import { filterCssKey } from '@/constants'
import { isTrackReference, isTrackReferencePinned } from '@livekit/components-core'
import { AudioTrack, ConnectionQualityIndicator, FocusToggle, LockLockedIcon, ParticipantContext, ParticipantName, ParticipantPlaceholder, ScreenShareIcon, TrackMutedIndicator, TrackRefContext, useEnsureTrackRef, useFeatureContext, useIsEncrypted, useMaybeLayoutContext, useMaybeParticipantContext, useMaybeTrackRefContext, useParticipantTile, VideoTrack } from '@livekit/components-react'
import { Track } from 'livekit-client'
import * as React from 'react'

/**
 * The `ParticipantContextIfNeeded` component only creates a `ParticipantContext`
 * if there is no `ParticipantContext` already.
 * @example
 * ```tsx
 * <ParticipantContextIfNeeded participant={trackReference.participant}>
 *  ...
 * </ParticipantContextIfNeeded>
 * ```
 * @public
 */
export function ParticipantContextIfNeeded(
  props: React.PropsWithChildren<{
    participant?: Participant
  }>,
) {
  const hasContext = !!useMaybeParticipantContext()
  return props.participant && !hasContext
    ? (
        <ParticipantContext value={props.participant}>
          {props.children}
        </ParticipantContext>
      )
    : (
        <>{props.children}</>
      )
}

/**
 * Only create a `TrackRefContext` if there is no `TrackRefContext` already.
 * @internal
 */
export function TrackRefContextIfNeeded(
  props: React.PropsWithChildren<{
    trackRef?: TrackReferenceOrPlaceholder
  }>,
) {
  const hasContext = !!useMaybeTrackRefContext()
  return props.trackRef && !hasContext
    ? (
        <TrackRefContext value={props.trackRef}>{props.children}</TrackRefContext>
      )
    : (
        <>{props.children}</>
      )
}

/** @public */
export interface ParticipantTileProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The track reference to display. */
  trackRef?: TrackReferenceOrPlaceholder
  disableSpeakingIndicator?: boolean

  onParticipantClick?: (event: ParticipantClickEvent) => void
}

/**
 * The `ParticipantTile` component is the base utility wrapper for displaying a visual representation of a participant.
 * This component can be used as a child of the `TrackLoop` component or by passing a track reference as property.
 *
 * @example Using the `ParticipantTile` component with a track reference:
 * ```tsx
 * <ParticipantTile trackRef={trackRef} />
 * ```
 * @example Using the `ParticipantTile` component as a child of the `TrackLoop` component:
 * ```tsx
 * <TrackLoop>
 *  <ParticipantTile />
 * </TrackLoop>
 * ```
 * @public
 */
export const ParticipantTile: (
  props: ParticipantTileProps & React.RefAttributes<HTMLDivElement>,
) => React.ReactNode = /* @__PURE__ */ function ParticipantTile(
  { ref, trackRef, children, onParticipantClick, disableSpeakingIndicator, ...htmlProps }: ParticipantTileProps & { ref: React.RefObject<HTMLDivElement> },
) {
  const filterCss = localStorage.getItem(filterCssKey) ?? ''
  const trackReference = useEnsureTrackRef(trackRef)

  const { elementProps } = useParticipantTile<HTMLDivElement>({
    htmlProps,
    disableSpeakingIndicator,
    onParticipantClick,
    trackRef: trackReference,
  })
  const isEncrypted = useIsEncrypted(trackReference.participant)
  const layoutContext = useMaybeLayoutContext()

  const autoManageSubscription = useFeatureContext()?.autoSubscription

  const handleSubscribe = React.useCallback(
    (subscribed: boolean) => {
      if (
        trackReference.source
        && !subscribed
        && layoutContext
        && layoutContext.pin.dispatch
        && isTrackReferencePinned(trackReference, layoutContext.pin.state)
      ) {
        layoutContext.pin.dispatch({ msg: 'clear_pin' })
      }
    },
    [trackReference, layoutContext],
  )

  return (
    <div ref={ref} style={{ position: 'relative' }} {...elementProps}>
      <TrackRefContextIfNeeded trackRef={trackReference}>
        <ParticipantContextIfNeeded participant={trackReference.participant}>
          {children ?? (
            <>
              {(isTrackReference(trackReference)
                && (trackReference.publication?.kind === 'video'
                  || trackReference.source === Track.Source.Camera
                  || trackReference.source === Track.Source.ScreenShare)
                ? (
                    <VideoTrack
                      style={{ filter: filterCss }}
                      trackRef={trackReference}
                      onSubscriptionStatusChanged={handleSubscribe}
                      manageSubscription={autoManageSubscription}
                    />
                  )
                : (
                    isTrackReference(trackReference) && (
                      <AudioTrack
                        trackRef={trackReference}
                        onSubscriptionStatusChanged={handleSubscribe}
                      />
                    )
                  )) || (<div className="h-52 bg-black"></div>)}
              <div className="lk-participant-placeholder">
                <ParticipantPlaceholder />
              </div>
              <div className="lk-participant-metadata">
                <div className="lk-participant-metadata-item">
                  {trackReference.source === Track.Source.Camera
                    ? (
                        <>
                          {isEncrypted && <LockLockedIcon style={{ marginRight: '0.25rem' }} />}
                          <TrackMutedIndicator
                            trackRef={{
                              participant: trackReference.participant,
                              source: Track.Source.Microphone,
                            }}
                            show="muted"
                          >
                          </TrackMutedIndicator>
                          <ParticipantName />
                        </>
                      )
                    : (
                        <>
                          <ScreenShareIcon style={{ marginRight: '0.25rem' }} />
                          <ParticipantName>的屏幕</ParticipantName>
                        </>
                      )}
                </div>
                <ConnectionQualityIndicator className="lk-participant-metadata-item" />
              </div>
            </>
          )}
          <FocusToggle trackRef={trackReference} />
        </ParticipantContextIfNeeded>
      </TrackRefContextIfNeeded>
    </div>
  )
}
