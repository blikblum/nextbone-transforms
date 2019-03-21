import { View } from 'backbone.marionette'

const ConfigurationSectorsView = View.extend({  
  initialize(options) {
    this.sectors = options.sectors
    this.modalService = container[MODAL_SERVICE]
  },

  events: {
    'click #sectors--list [data-action-edit]': 'editSectorClick',
    'click #sectors--add-sector': 'addSector'
  },

  editSectorClick(e) {
    e.preventDefault()
    const sector = $(e.currentTarget).closest('tr')[0].sector
    this.editSector(sector)
  },

  addSector() {
    const sector = new Sector()
    this.editSector(sector)
  },

  template: function () {
    return (
      <div>
      </div>
    )
  }
})

export { ConfigurationSectorsView }