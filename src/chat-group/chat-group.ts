import { UsersPromise } from '../auth/dtos/Users.dto';
import { MessagesGroup } from '../entities/MessagesGroup';
import {
  AnswerMessagesGroups,
  CreateMessageGroupParams,
  CreateMessageRoomsResponse,
  DeleteMessages,
  ForwardMessages,
  UpdateEmoji,
  UpdateGroupsMessages,
} from '../untills/types';
import { MessagesGroupsUpdate } from './dtos/chat-group.dto';

export interface IMessageGroupsService {
  createMessagesForGroup(
    createMessageParams: CreateMessageGroupParams,
  ): Promise<CreateMessageRoomsResponse>;
  getMessagesGroup(id: string): Promise<MessagesGroup[]>;
  deleteMessages(id: string, informationMess: DeleteMessages);
  recallMessage(
    fullName: string,
    id: string,
    informationUpdateMessage: UpdateGroupsMessages,
  );
  feedbackMessages(
    id: string,
    answerMessages: AnswerMessagesGroups,
    user: UsersPromise,
  );
  iconOnMessages(
    id: string,
    updateEmoji: UpdateEmoji,
  ): Promise<MessagesGroupsUpdate>;
  forwardMessagesGroups(
    infoMessages: ForwardMessages,
  ): Promise<ForwardMessages>;
}
