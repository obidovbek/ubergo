'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('geo_countries', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      created_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      },
      updated_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      }
    });

    await queryInterface.addIndex('geo_countries', ['name'], {
      unique: true,
      name: 'idx_geo_countries_name'
    });

    await queryInterface.createTable('geo_provinces', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      country_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'geo_countries', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      created_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      },
      updated_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      }
    });

    await queryInterface.addIndex('geo_provinces', ['country_id'], {
      name: 'idx_geo_provinces_country_id'
    });
    await queryInterface.addIndex('geo_provinces', ['country_id', 'name'], {
      unique: true,
      name: 'idx_geo_provinces_country_name'
    });

    await queryInterface.createTable('geo_city_districts', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      province_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'geo_provinces', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      created_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      },
      updated_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      }
    });

    await queryInterface.addIndex('geo_city_districts', ['province_id'], {
      name: 'idx_geo_city_districts_province_id'
    });
    await queryInterface.addIndex('geo_city_districts', ['province_id', 'name'], {
      unique: true,
      name: 'idx_geo_city_districts_province_name'
    });

    await queryInterface.createTable('geo_administrative_areas', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      city_district_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'geo_city_districts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      created_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      },
      updated_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      }
    });

    await queryInterface.addIndex(
      'geo_administrative_areas',
      ['city_district_id'],
      {
        name: 'idx_geo_administrative_areas_city_district_id'
      }
    );
    await queryInterface.addIndex(
      'geo_administrative_areas',
      ['city_district_id', 'name'],
      {
        unique: true,
        name: 'idx_geo_administrative_areas_city_district_name'
      }
    );

    await queryInterface.createTable('geo_settlements', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      city_district_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'geo_city_districts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      created_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      },
      updated_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      }
    });

    await queryInterface.addIndex('geo_settlements', ['city_district_id'], {
      name: 'idx_geo_settlements_city_district_id'
    });
    await queryInterface.addIndex('geo_settlements', ['city_district_id', 'name'], {
      unique: true,
      name: 'idx_geo_settlements_city_district_name'
    });

    await queryInterface.createTable('geo_neighborhoods', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      city_district_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'geo_city_districts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      created_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      },
      updated_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      }
    });

    await queryInterface.addIndex('geo_neighborhoods', ['city_district_id'], {
      name: 'idx_geo_neighborhoods_city_district_id'
    });
    await queryInterface.addIndex('geo_neighborhoods', ['city_district_id', 'name'], {
      unique: true,
      name: 'idx_geo_neighborhoods_city_district_name'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('geo_neighborhoods');
    await queryInterface.dropTable('geo_settlements');
    await queryInterface.dropTable('geo_administrative_areas');
    await queryInterface.dropTable('geo_city_districts');
    await queryInterface.dropTable('geo_provinces');
    await queryInterface.dropTable('geo_countries');
  }
};


