/**
 * DeletionRequest Model
 * Manages account deletion requests (72-hour grace period)
 */

import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

// DeletionRequest attributes
export interface DeletionRequestAttributes {
  id: string;
  user_id: string;
  requested_at: Date;
  deadline_at: Date;
  status: 'pending' | 'done' | 'cancelled';
}

// Creation attributes
export interface DeletionRequestCreationAttributes
  extends Optional<DeletionRequestAttributes, 'id' | 'requested_at' | 'status'> {}

// DeletionRequest model class
export class DeletionRequest
  extends Model<DeletionRequestAttributes, DeletionRequestCreationAttributes>
  implements DeletionRequestAttributes {
  declare id: string;
  declare user_id: string;
  declare requested_at: Date;
  declare deadline_at: Date;
  declare status: 'pending' | 'done' | 'cancelled';
}

export function initDeletionRequest(sequelize: Sequelize) {
  DeletionRequest.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      requested_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      deadline_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'done', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'deletion_requests',
      timestamps: false,
      underscored: true,
      indexes: [
        {
          fields: ['user_id'],
          name: 'idx_deletion_requests_user_id'
        },
        {
          fields: ['status', 'deadline_at'],
          name: 'idx_deletion_requests_status_deadline'
        }
      ]
    }
  );
  
  return DeletionRequest;
}

export default DeletionRequest;

