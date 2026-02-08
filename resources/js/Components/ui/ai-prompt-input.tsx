import { useState, useRef } from 'react';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from '@/Components/ui/prompt-input';
import { PromptInputContainer } from '@/Components/ui/prompt-input-container';
import { HStack } from '@/Components/ui/stack';
import { ArrowUp, Plus, Mic, X, Check, FileText } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { AudioWaveform } from '@/Components/ui/AudioWaveform';
import { useAudioRecorder } from '@/Hooks/useAudioRecorder';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';

export interface AIPromptInputProps {
  /** Input value */
  value: string;
  /** Callback when value changes */
  onValueChange: (value: string) => void;
  /** Callback when submit is clicked */
  onSubmit: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum height for textarea */
  minHeight?: string;
  /** Enable file attachments */
  enableFileAttachments?: boolean;
  /** File attachments */
  attachments?: File[];
  /** Callback when files are selected */
  onFilesChange?: (files: File[]) => void;
  /** Allowed file types (e.g., "image/*,.pdf,.doc,.docx") */
  acceptedFileTypes?: string;
  /** Max file size in bytes (default: 10MB) */
  maxFileSize?: number;
  /** Enable voice recording */
  enableVoiceRecording?: boolean;
  /** Callback when recording stops (for transcription) */
  onRecordingStop?: (audioBlob: Blob) => Promise<void>;
  /** Focus state */
  isFocused?: boolean;
  /** Callback when focus changes */
  onFocusChange?: (focused: boolean) => void;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

export function AIPromptInput({
  value,
  onValueChange,
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = 'Type your message here...',
  minHeight = '20',
  enableFileAttachments = false,
  attachments = [],
  onFilesChange,
  acceptedFileTypes = 'image/*,.pdf,.doc,.docx',
  maxFileSize = 10 * 1024 * 1024, // 10MB
  enableVoiceRecording = false,
  onRecordingStop,
  isFocused: externalFocused,
  onFocusChange,
  className,
  style,
}: AIPromptInputProps) {
  const [internalFocused, setInternalFocused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFocused = externalFocused ?? internalFocused;

  // Audio recording
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const handleFocusChange = (focused: boolean) => {
    setInternalFocused(focused);
    onFocusChange?.(focused);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !onFilesChange) return;

    const newFiles = Array.from(files).filter(file => {
      // Max file size check
      if (file.size > maxFileSize) {
        alert(`${file.name} is too large. Maximum file size is ${Math.round(maxFileSize / 1024 / 1024)}MB.`);
        return false;
      }
      return true;
    });

    onFilesChange([...attachments, ...newFiles]);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    if (!onFilesChange) return;
    onFilesChange(attachments.filter((_, i) => i !== index));
  };

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording and transcribe
      const audioBlob = await stopRecording();
      if (audioBlob && onRecordingStop) {
        setIsTranscribing(true);
        try {
          await onRecordingStop(audioBlob);
        } catch (error) {
          console.error('Recording processing error:', error);
        } finally {
          setIsTranscribing(false);
        }
      }
    } else {
      // Start recording
      try {
        await startRecording();
      } catch (error) {
        console.error('Failed to start recording:', error);
        alert('Could not access microphone. Please grant permission.');
      }
    }
  };

  // Format recording time as MM:SS
  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('w-full', className)} style={style}>
      {/* Hidden file input */}
      {enableFileAttachments && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes}
          onChange={handleFileSelect}
          className="hidden"
        />
      )}

      <PromptInputContainer
        className="w-full"
        gradient={
          isFocused || value.length > 0
            ? 'linear-gradient(265deg, hsl(var(--primary) / 0.4) 24.67%, hsl(var(--primary) / 0.25) 144.07%)'
            : 'linear-gradient(265deg, hsl(var(--primary) / 0.25) 24.67%, hsl(var(--background)) 144.07%)'
        }
      >
        <PromptInput
          value={value}
          onValueChange={onValueChange}
          isLoading={isLoading}
          onSubmit={onSubmit}
          disabled={disabled}
          className="w-full border-0 shadow-none"
        >
        {isRecording ? (
          // Recording mode - show waveform
          <div className={cn('px-4 py-2 flex items-start', minHeight && `min-h-${minHeight}`)}>
            <HStack gap={3} className="items-center">
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
              <span className="text-label text-muted-foreground">
                {formatRecordingTime(recordingTime)}
              </span>
              <AudioWaveform isRecording={true} className="flex-1" />
            </HStack>
          </div>
        ) : (
          // Normal mode - show textarea
          <div className="relative w-full">
            {/* File attachments chips */}
            {enableFileAttachments && attachments.length > 0 && (
              <div className="px-4 pt-2 pb-1">
                <HStack gap={2} className="flex-wrap">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-body border border-border"
                    >
                      <Icon icon={FileText} size={12} className="text-muted-foreground" />
                      <span className="text-foreground truncate max-w-32">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Icon icon={X} size={12} />
                      </button>
                    </div>
                  ))}
                </HStack>
              </div>
            )}
            <PromptInputTextarea
              placeholder={placeholder}
              className="text-base text-foreground placeholder:text-muted-foreground px-4 min-h-20"
              onFocus={() => handleFocusChange(true)}
              onBlur={() => handleFocusChange(false)}
            />
          </div>
        )}
        <PromptInputActions className="px-2 pb-2 pt-0 flex justify-between">
          <HStack gap={1}>
            {/* Add Button - hide when recording */}
            {!isRecording && enableFileAttachments && (
              <PromptInputAction tooltip="Add attachment">
                <Button
                  variant="outline"
                  iconOnly
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || disabled}
                  className="rounded-full"
                >
                  <Icon icon={Plus} size={20} />
                </Button>
              </PromptInputAction>
            )}
          </HStack>

          {/* Right side buttons */}
          <HStack gap={1}>
            {isRecording ? (
              // Recording mode - show Cancel (X) and Submit (Check) icons
              <>
                <PromptInputAction tooltip="Cancel recording">
                  <Button
                    variant="outline"
                    iconOnly
                    size="md"
                    onClick={() => cancelRecording()}
                    className="rounded-full"
                  >
                    <Icon icon={X} size={20} className="text-destructive" />
                  </Button>
                </PromptInputAction>

                <PromptInputAction tooltip="Submit recording">
                  <Button
                    variant="primary"
                    iconOnly
                    size="md"
                    onClick={handleMicClick}
                    className="rounded-full"
                  >
                    <Icon icon={Check} size={20} className="text-inverse" />
                  </Button>
                </PromptInputAction>
              </>
            ) : (
              // Normal mode - show Mic and Submit buttons
              <>
                {enableVoiceRecording && (
                  <PromptInputAction tooltip={isTranscribing ? "Transcribing..." : "Voice input"}>
                    <Button
                      variant="outline"
                      iconOnly
                      size="md"
                      onClick={handleMicClick}
                      disabled={isLoading || disabled}
                      className="rounded-full"
                    >
                      <Icon icon={Mic} size={20} className={cn(
                        isTranscribing && "animate-pulse text-primary"
                      )} />
                    </Button>
                  </PromptInputAction>
                )}

                <PromptInputAction tooltip="Submit">
                  <Button
                    variant="primary"
                    iconOnly
                    size="md"
                    onClick={onSubmit}
                    disabled={isLoading || !value.trim() || disabled}
                    className="rounded-full"
                  >
                    <Icon icon={ArrowUp} size={20} className="text-inverse" />
                  </Button>
                </PromptInputAction>
              </>
            )}
          </HStack>
        </PromptInputActions>
      </PromptInput>
      </PromptInputContainer>
    </div>
  );
}
