import {Callback, DefaultAliases, StringKey} from 'ctrl-keys'

export type KeysSequence = Array<StringKey<DefaultAliases>>
export type Binding = [...KeysSequence, Callback]
